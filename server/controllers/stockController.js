import { StatusCodes } from 'http-status-codes';
import { getAvailableCaseStock } from "../daos/stockDao.js";
import { getCasePrice } from '../daos/caseOrdersDao.js';
import { getEquipmentParameters } from '../daos/equipmentParametersDao.js';

export const getCaseStockInformation = async (req, res, next) => {
    try {
        const { available_units } = await getAvailableCaseStock();
        let pricePerCase;
        
        try {
            const {
                plastic_ratio,
                aluminium_ratio,
                production_rate
            } = await getEquipmentParameters();

            const plasticPerCase = plastic_ratio/production_rate;
            const aluminiumPerCase = aluminium_ratio/production_rate;

            const { selling_price: sellingPrice } = await getCasePrice(plasticPerCase, aluminiumPerCase);
            pricePerCase = Math.round(sellingPrice);

        } catch (error) {
            pricePerCase = 20;
        }

        const response = {
            available_units: parseInt(available_units),
            price_per_unit: pricePerCase,
        };

        return res
            .status(StatusCodes.OK)
            .json(response);

    } catch (error) {
        next(error);
    };
};