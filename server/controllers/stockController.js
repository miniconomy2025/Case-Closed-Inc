import { StatusCodes } from 'http-status-codes';
import { getAvailableCaseStock } from "../daos/stockDao.js";
import { getCasePrice } from '../daos/caseOrdersDao.js';

export const getCaseStockInformation = async (req, res, next) => {
    try {
        const { available_units } = await getAvailableCaseStock();
        // Defaults of function assume 4 plastic : 7 aluminium for 1 case, added markup is 30% on base cost
        const { selling_price: sellingPrice } = await getCasePrice();

        const pricePerCase = Math.round(sellingPrice);

        const response = {
            available_units,
            price_per_unit: pricePerCase,
        };

        return res
            .status(StatusCodes.OK)
            .json(response);

    } catch (error) {
        next(error);
    };
};