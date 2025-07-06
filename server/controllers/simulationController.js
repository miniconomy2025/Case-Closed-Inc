import { StatusCodes } from 'http-status-codes';
import cron from 'node-cron';
import SimulateProduction from '../cron/jobs/simulateProduction.js';
import DecisionEngine from '../cron/jobs/decisionEngine.js';
import CancelUnpaidOrdersJob from '../cron/jobs/canelUnpaidOrders.js';
import logger from "../utils/logger.js";


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
        return `${this.dayOfMonth}/${this.month}/${this.year}`
    }

    getDaysOfSimulation(){
        return this.daysSinceStart;
    }

    async run(){
        if(this.interval == null){
            this.interval = setInterval(() => {
                this.startOfDay();
                logger.info(`[Date]: ${this.getDate()}`);
            }, 120000) // 2 mins: 120000
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
    // Open bank account
    // Call Commercial Bank
    const accountNumber = 'TESTACC1';
    logger.info(`[SimulationStart]: Opened Bank Account: ${accountNumber}`);

    // Get loan
    const loanTotal = 1000000;
    logger.info(`[SimulationStart]: Recieved Loan: ${loanTotal}`);

    // Buy machine from THoH
    const machines = 5;
    logger.info(`[SimulationStart]: Bought ${machines} machines`);
    
    // Buy materials from THoH
    const plastcic = 1000;
    const aluminium = 500;
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


// export const handleSimulationStart = async (req, res, next) => {
//   try {
    
//     // Get initial starting time from the Hand
//     // TODO - apply time stamp to start schedulers then
    
//     // Open bank account with commercial bank
//     // TODO /account/create - returns bank account number which we should probably store
    
//     if (schedule) return res.status(400).json({ message: 'Job already running' });

//     const INTERVAL_SECONDS = 10; // 120 for 2 min per day
//     const SIMULATION_EPOCH = Math.floor(Date.now() / 1000) - 5; // req.body.simulationEpoch
//     const now = Math.floor(Date.now() / 1000);
//     const timeSinceEpoch = now - SIMULATION_EPOCH;
//     const secondsSinceLastTrigger = timeSinceEpoch % INTERVAL_SECONDS;
//     const delaySeconds = INTERVAL_SECONDS - secondsSinceLastTrigger;

//     schedule = cron.schedule(`*/${INTERVAL_SECONDS} * * * * *`, simulateProduction, { scheduled: false });

//     setTimeout(() => {
//       schedule.start();
//     }, delaySeconds * 1000);

//     return res
//         .status(StatusCodes.OK)
//         .json({ message: 'Successfully started simulation' });

//   } catch (error) {
//     next(error);
//   };
// };
