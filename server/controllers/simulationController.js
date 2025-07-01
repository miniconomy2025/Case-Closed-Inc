import { StatusCodes } from 'http-status-codes';

export const handleSimulationStart = async (req, res, next) => {
  try {
    
    // Get initial starting time from the Hand
    // TODO - apply time stamp to start schedulers then
    
    // Open bank account with commercial bank
    // TODO /account/create - returns bank account number which we should probably store

    return res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully started simulation' });

  } catch (error) {
    next(error);
  };
};
