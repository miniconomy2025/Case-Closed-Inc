import { StatusCodes } from "http-status-codes";
import cron from "node-cron";

import SimulateProduction from "../cron/jobs/simulateProduction.js";
import DecisionEngine from "../cron/jobs/decisionEngine.js";
import CancelUnpaidOrdersJob from "../cron/jobs/canelUnpaidOrders.js";
import logger from "../utils/logger.js";
import ThohClient from "../clients/ThohClient.js";
import { clearMockData } from "../daos/simulationDao.js";

let schedule = null;

class SimulationTimer {
  constructor() {
    if (SimulationTimer.instance) {
      return SimulationTimer.instance;
    }

    this.daysSinceStart = 0;
    this.dayOfMonth = 1;
    this.month = 1;
    this.year = 2050;
    this.jobs = [
      new DecisionEngine(),
      new SimulateProduction(),
      new CancelUnpaidOrdersJob(),
    ];

    this.interval = null;

    SimulationTimer.instance = this;
  }


  async startOfSim(){
    logger.info(`[Date]: ${simulationTimer.getDate()}`);
    simulationTimer.jobs[0].run();
  }

  async startOfDay() {
    this.incrementDate();
    logger.info(`[Date]: ${simulationTimer.getDate()}`);
    
    // Run Jobs
    this.jobs.forEach((job) => {
      job.run();
    });
  }

  incrementDate(){
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
  }

  getDate() {
    const day = String(this.dayOfMonth).padStart(2, "0");
    const month = String(this.month).padStart(2, "0");
    const year = this.year;

    const date = `${year}-${month}-${day}`;
    return date;
  }

  getDaysOfSimulation() {
    return this.daysSinceStart;
  }

  getDaysPassed(startDate) {
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [currentYear, currentMonth, currentDay] = this.getDate()
      .split("-")
      .map(Number);

    const totalDaysStart =
      startYear * 360 + (startMonth - 1) * 30 + (startDay - 1);
    const totalDaysCurrent =
      currentYear * 360 + (currentMonth - 1) * 30 + (currentDay - 1);

    return totalDaysCurrent - totalDaysStart;
  }

  async run() {
    if (this.interval == null) {
      this.interval = setInterval(() => {
        this.startOfDay();
      }, 120000); // 2 mins: 120000
    }
  }

  async reset() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.daysSinceStart = 0;
        this.dayOfMonth = 1;
        this.month = 1;
        this.year = 2050
    }
}

const simulationTimer = new SimulationTimer();
export default simulationTimer;

export const handleSimulationStart = async (req, res, next) => {
  try {
    logger.info("=================== Simulation Started ===================");

    await clearMockData();
    logger.info(`[SimulationStart]: Cleared database`);
            // Get production ratios and production rates 
    try {
        await ThohClient.syncCaseMachineToEquipmentParameters();
    } catch {
        logger.info(`[SimulationStart]: Failed to sync case machine parameters`);
    };
    
    simulationTimer.startOfSim();

    simulationTimer.run();
    return res
      .status(StatusCodes.OK)
      .json({ message: "Successfully started simulation" });
  } catch (error) {
    next(error);
  }
};

export const handleSimulationEnd = async (req, res, next) => {
  try {
    logger.info("=================== Simulation Stoped ===================");
    simulationTimer.reset();
    return res
      .status(StatusCodes.OK)
      .json({ message: "Successfully stopped simulation" });
  } catch (error) {
    next(error);
  }
};
