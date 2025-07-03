import { StatusCodes } from 'http-status-codes';
import { getAvailableCaseStock } from "../daos/stockDao.js";

export const getCaseStockInformation = async (req, res, next) => {
  try {

    const stockStatus = await getAvailableCaseStock();
    const pricePerCase = 100.0; // calculate this based on raw material prices

    const status = StatusCodes.OK;
    const response = {
        ...stockStatus,
        price_per_unit: pricePerCase,
    };

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};