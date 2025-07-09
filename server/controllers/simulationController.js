import { StatusCodes } from 'http-status-codes';
import cron from 'node-cron';

import SimulateProduction from '../cron/jobs/simulateProduction.js';
import DecisionEngine from '../cron/jobs/decisionEngine.js';
import CancelUnpaidOrdersJob from '../cron/jobs/canelUnpaidOrders.js';
import logger from "../utils/logger.js";
import { decrementStockByName } from '../daos/stockDao.js';
import apiUrls from '../utils/companyUrls.js';
import { getAccountNumber, updateAccountNumber } from '../daos/bankDetailsDao.js';

import OrderRawMaterialsClient from '../clients/OrderRawMaterialsClient.js';
import OrderMachineClient from '../clients/OrderMachineClient.js'
import BankClient from '../clients/BankClient.js';

let schedule = null;

class SimulationTimer {
    constructor() {
        if (SimulationTimer.instance) {
            return SimulationTimer.instance;
        }

        this.daysSinceStart = 0;
        this.dayOfMonth = 0;
        this.month = 1;
        this.year = 2050
        this.jobs = [
            new DecisionEngine(),
            new SimulateProduction(),
            new CancelUnpaidOrdersJob()
        ];

        this.interval = null;

        SimulationTimer.instance = this;
    }

    async startOfDay() {
        // Do increments
        this.daysSinceStart++;
        this.dayOfMonth++;
        if (this.dayOfMonth > 30) {
            this.dayOfMonth = 1;
            this.month++;

            if (this.month > 12) {
                this.month = 1;
                this.year++;
            }
        }

        // Run Jobs
        this.jobs.forEach(job => {
            job.run();
        })

    }

    getDate(){
        const day = String(this.dayOfMonth).padStart(2, '0');
        const month = String(this.month).padStart(2, '0');
        const year = this.year;

        const date = `${year}-${month}-${day}`;
        return date;
    }

    getDaysOfSimulation(){
        return this.daysSinceStart;
    }

    getDaysPassed(startDate){
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [currentYear, currentMonth, currentDay] = this.getDate().split('-').map(Number);

        const totalDaysStart = (startYear * 360) + ((startMonth - 1) * 30) + (startDay - 1);
        const totalDaysCurrent = (currentYear * 360) + ((currentMonth - 1) * 30) + (currentDay - 1);

        return totalDaysCurrent - totalDaysStart;
    }

    async run(){
        if(this.interval == null){
            this.interval = setInterval(() => {
                this.startOfDay();
                logger.info(`[Date]: ${this.getDate()}`);
            }, 500) // 2 mins: 120000
        }
    }

    async reset(){
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.daysSinceStart = 0;
        this.dayOfMonth = 0;
        this.month = 1;
        this.year = 2050
    }
}


const simulationTimer = new SimulationTimer();
export default simulationTimer;


export const handleSimulationStart = async (req, res, next) => {
  try {
    logger.info('=================== Simulation Started ===================')

    const { accountNumber } = await BankClient.createAccount();
    // Open bank account
    // Call Commercial Bank
    await updateAccountNumber(accountNumber);

    logger.info(`[SimulationStart]: Opened Bank Account: ${accountNumber}`);

    // Get loan
    const { success, loanNumber } = await BankClient.takeLoan({amount: 1000000});

    if(success){
        logger.info(`[SimulationStart]: Recieved Loan: ${loanTotal}`);
    }else{
        logger.info(`[SimulationStart]: Bank Rejected Loan: ${loanTotal}`);
    }
    

    // Buy machine from THoH
    const { machines } = await OrderMachineClient.processMachineOrderFlow({
        machineName: 'case_machine',
        quantity: 20
    })
    logger.info(`[SimulationStart]: Bought 20 machines`);
    
    // Buy materials from THoH
    const plastcic = 10000;
    const aluminium = 10000;

    await OrderRawMaterialsClient.processOrderFlow({
        name: 'plastic',
        quantity: plastcic
    });

    await OrderRawMaterialsClient.processOrderFlow({
        name: 'aluminium',
        quantity: aluminium
    })

    logger.info(`[SimulationStart]: Bought ${plastcic} plastic and ${aluminium} aluminium`);

    simulationTimer.startOfDay();
    logger.info(`[Date]: ${simulationTimer.getDate()}`);
    simulationTimer.run();

    return res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully started simulation' });

  } catch (error) {
    next(error);
  };
};

export const handleSimulationEnd = async (req, res, next) => {
    try {
        logger.info('=================== Simulation Stoped ===================')
        simulationTimer.reset();
        return res
            .status(StatusCodes.OK)
            .json({ message: 'Successfully stopped simulation' });

    } catch (error){
        next(error);
    }
}
