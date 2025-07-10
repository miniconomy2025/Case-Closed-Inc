import { 
    getTransactionsFromBank,
    getOrderCounts, 
    getMaterialStockCount,
    getAllShipments,
    getSalesReport,
    getCaseOrders,
    getOrderStats
} from "../daos/reportDao.js";

import {
    getAvailableCaseStock
} from "../daos/stockDao.js";

import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import simulationTimer from "./simulationController.js";
import BankClient from "../clients/BankClient.js";

export const getBalance = async (req, res, next) => {
  try {
    const balance = await BankClient.getBalance()

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
    const orders = await getOrderCounts();

    if(orders){
        res.status(StatusCodes.OK).json(orders);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No orders of that type"})
    }    
  } catch (error) {
    next(error);
  }
};

export const getStock = async (req, res, next) => {
  try {
    const materials = await getMaterialStockCount()

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
    const cases = await getAvailableCaseStock()

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
    const shipments = await getAllShipments();

    if(shipments){
        res.status(StatusCodes.OK).json(shipments);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No shipments of that type"})
    }    
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const sales = await getSalesReport();

    if(sales){
        res.status(StatusCodes.OK).json(sales);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No sales of that type"})
    }    
  } catch (error) {
    next(error);
  }
};

export const getCaseOrdersReport = async (req, res, next) => {
    try {
    const caseOrders = await getCaseOrders();

    if(caseOrders){
        res.status(StatusCodes.OK).json(caseOrders);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No orders found"})
    }    
  } catch (error) {
    next(error);
  }

}

export const getCaseOrdersStatsReport = async (req, res, next) => {
    try {
    const caseOrdersStats = await getOrderStats();

    if(caseOrdersStats){
        res.status(StatusCodes.OK).json(caseOrdersStats);
    }else {
        res.status(StatusCodes.NOT_FOUND).json({message: "No orders stats found"})
    }    
  } catch (error) {
    next(error);
  }

}

export const getSimulationDate = async (req, res, next) => {
  try {
    const date = simulationTimer.getDate();
    const daysOfSimulation = simulationTimer.getDaysOfSimulation();

    res.status(StatusCodes.OK).json({
      date,
      daysOfSimulation
    });

  } catch (error) {
    next(error);
  }
};
