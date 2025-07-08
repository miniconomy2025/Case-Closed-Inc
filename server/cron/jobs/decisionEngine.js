import { 
    getBalanceFromBank,
    getLoanTotalFromBank,
    getOrderCounts, 
    getMaterialStockCount,
} from "../../daos/reportDao.js";

import {
    getAvailableCaseStock
} from "../../daos/stockDao.js"

import logger from "../../utils/logger.js";

export default class DecisionEngine {

    constructor() {
        this.thresholds = {
            plasticMin: 1000,
            aluminiumMin: 1000,
            machineMin: 2,
            caseProductionBuffer: 50,
            demandThreshold: 0.5,
            minCash: 5000,
        };
    }

    async getState() {
        const { balance }= await getBalanceFromBank();
        const { loan } = await getLoanTotalFromBank();
        const materialStock = await getMaterialStockCount();
        const caseStock = await getAvailableCaseStock();

        const inventory = {
            plastic: materialStock.plastic,
            aluminium: materialStock.aluminium,
            machine: materialStock.machine,
            casesAvailable: parseInt(caseStock.reserved_units),
            casesReserved: parseInt(caseStock.available_units)
        }

        return {
            balance,
            loan,
            inventory,
        };
    }


    async buyMaterial(state, material) {
        const { inventory, balance } = state;
        const demandRatio = inventory.casesAvailable / inventory.casesReserved;
        const minThreshold = this.thresholds[`${material}Min`];

        return (
            inventory[material] < minThreshold &&
            demandRatio < this.thresholds.demandThreshold &&
            balance > this.thresholds.minCash
        );
    }

    async buyMachine(state) {
        const { balance, inventory } = state;

        return inventory.machine < this.thresholds.machineMin && balance > this.thresholds.minCash * 1.5;
    }

    async repayLoan(state) {
        const { balance, loan, inventory } = state;

        const hasSurplusInventory = inventory.plastic > this.thresholds.plasticMin &&
                                    inventory.aluminium > this.thresholds.aluminiumMin;
        
        return loan > 0 && (balance > this.thresholds.minCash * 1.5 || hasSurplusInventory);
    }    

    async run() {
        const state = await this.getState();

        // TODO: Integrate with systems
        if(await this.buyMaterial(state, 'plastic')){
            
            logger.info('[DecisionEngine]: Plastic stock low! Need to buy')
        }else {
            
            logger.info('[DecisionEngine]: Plastic stock good!')
        }

        if(await this.buyMaterial(state, 'aluminium')){
            
            logger.info('[DecisionEngine]: Aluminium stock low! Need to buy')
        }else {
            
            logger.info('[DecisionEngine]: Aluminium stock good!')
        }

        if(await this.buyMachine(state)){
            logger.info('[DecisionEngine]: Can buy machine')
        }else {
            
            logger.info('[DecisionEngine]: Do not buy machine')
        }

        if(await this.repayLoan(state)){
            
            logger.info('[DecisionEngine]: Need to repay loan')
        }else {
            
            logger.info('[DecisionEngine]: No need to repay loan')
        }
    }

} 