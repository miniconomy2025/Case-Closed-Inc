import { StatusCodes } from 'http-status-codes';
import cron from 'node-cron';
import simulateProduction from '../cron/jobs/simulateProduction.js';
import logger from '../utils/logger.js';
import { decrementStockByName } from '../daos/stockDao.js';

let schedule = null;

export const handleSimulationStart = async (req, res, next) => {
  try {
    
    // Get initial starting time from the Hand
    // TODO - apply time stamp to start schedulers then
    
    // Open bank account with commercial bank
    // TODO /account/create - returns bank account number which we should probably store
    
    if (schedule) return res.status(400).json({ message: 'Job already running' });

    const INTERVAL_SECONDS = 10; // 120 for 2 min per day
    const SIMULATION_EPOCH = Math.floor(Date.now() / 1000) - 5; // req.body.simulationEpoch
    const now = Math.floor(Date.now() / 1000);
    const timeSinceEpoch = now - SIMULATION_EPOCH;
    const secondsSinceLastTrigger = timeSinceEpoch % INTERVAL_SECONDS;
    const delaySeconds = INTERVAL_SECONDS - secondsSinceLastTrigger;

    schedule = cron.schedule(`*/${INTERVAL_SECONDS} * * * * *`, simulateProduction, { scheduled: false });

    setTimeout(() => {
      schedule.start();
    }, delaySeconds * 1000);

    return res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully started simulation' });

  } catch (error) {
    next(error);
  };
};

export const handleSimulationEvent = async (req, res, next) => {
    try {
        const eventType = req.body.eventType ?? 'machine_break';
        
        switch (eventType) {
            case 'machine_break':
                logger.info('Handling removal of machines due to break event');
                const quantity = req.body.quantity ?? 1;
                await decrementStockByName('machine', quantity);
                break;
            default:
                logger.warn('Unknown simulation event type');
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ message: 'Unknown simulation event type' });
        };

        return res
            .status(StatusCodes.OK)
            .json({ message: 'Successfully handled simulation event' });
    } catch(error) {
        next(error);
    };
};