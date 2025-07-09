import logger from "../utils/logger.js";
import { decrementStockByNameFlexible } from "../daos/stockDao.js";
import { StatusCodes } from "http-status-codes";

export const handleMachineFailure = async (req, res, next) => {
    try {
        const { machineName, failureQuantity, simulationDate, simulationTime } = req.body;

        if (machineName === 'case_machine') {
            logger.info('Handling removal of machines due to break event');
            await decrementStockByNameFlexible('machine', failureQuantity);
            return res
                .status(StatusCodes.OK)
                .json({ message: 'Successfully handled simulation machine break event' });
        };

        logger.warn('Unknown machine name');
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ message: 'Unknown machine name' });
 
    } catch(error) {
        next(error);
    };
};