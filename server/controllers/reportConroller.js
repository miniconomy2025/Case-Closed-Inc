import { 
    getBalanceFromBank,
    getTransactionsFromBank,
    getOrdersByType, 
    getMaterialAmounts,
    getCasesProduced,
    getShipmentsByStatus,
} from "../daos/reportDao.js";
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const getBalance = async (req, res, next) => {
  try {
    const balance = await getBalanceFromBank()

    if(balance){
        res.status(StatusCodes.OK).json(balance);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "Balance could not be found"})
    }
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { type } = req.query;
    const orders = await getOrdersByType(type);

    if(orders){
        res.status(StatusCodes.OK).json(orders);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No orders of that type"})
    }    
  } catch (error) {
    next(error);
  }
};

export const getMaterials = async (req, res, next) => {
  try {
    const materials = await getMaterialAmounts()

    if(materials){
        res.status(StatusCodes.OK).json(materials);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No materials found"})
    }
  } catch (error) {
    next(error);
  }
};


export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await getTransactionsFromBank()

    if(transactions){
        res.status(StatusCodes.OK).json(transactions);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "Transactions could not be found"})
    }
  } catch (error) {
    next(error);
  }
};

export const getCases = async (req, res, next) => {
  try {
    const cases = await getCasesProduced()

    if(cases){
        res.status(StatusCodes.OK).json(cases);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No cases found"})
    }
  } catch (error) {
    next(error);
  }
};


export const getShipments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const shipments = await getShipmentsByStatus(status);

    if(shipments){
        res.status(StatusCodes.OK).json(shipments);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No shipments of that type"})
    }    
  } catch (error) {
    next(error);
  }
};