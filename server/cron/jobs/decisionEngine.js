import { getAvailableCaseStock, getAvailableMaterialStockCount } from "../../daos/stockDao.js";

import logger from "../../utils/logger.js";
import OrderRawMaterialsClient from "../../clients/OrderRawMaterialsClient.js";
import OrderMachineClient from "../../clients/OrderMachineClient.js";
import BankClient from "../../clients/BankClient.js";

import {
  updateAccount,
} from "../../daos/bankDetailsDao.js";

export default class DecisionEngine {
  constructor() {
    this.thresholds = {
      plasticMin: 1000,
      aluminiumMin: 1000,
      machineMin: 10,
      caseProductionBuffer: 100,
      demandThreshold: 0.5,
      excessCashThreshold: 200000
    };
  }

  async getState() {
    const { balance } = await BankClient.getBalance();
    const loans = await BankClient.getOutstandingLoans();
    const materialStock = await getAvailableMaterialStockCount();
    const caseStock = await getAvailableCaseStock();

    const inventory = {
      plastic: materialStock.plastic,
      aluminium: materialStock.aluminium,
      machine: materialStock.machine,
      casesAvailable: parseInt(caseStock.available_units),
      casesReserved: parseInt(caseStock.reserved_units),
    };

    return {
      balance,
      loans,
      inventory,
    };
  }

  async buyMaterial(state, material) {
    const { inventory, balance } = state;
    const demandRatio = inventory.casesAvailable > 0 ? inventory.casesReserved / inventory.casesAvailable : 0;
    const minThreshold = this.thresholds[`${material}Min`];

    return (inventory[material] < minThreshold && demandRatio > this.thresholds.demandThreshold) || ( balance > this.thresholds.excessCashThreshold);
  }

  async buyMachine(state) {
    const { balance, inventory } = state;

    return (inventory.machine < this.thresholds.machineMin) || (balance > this.thresholds.excessCashThreshold);
  }

    async run() {
        let have_account = false;
        try{
            await BankClient.getMyAccount();
            have_account = true;
        }catch {
            have_account = false;
        }

        if(have_account){
            const state = await this.getState();
            if(state.balance < 2000){
                try {
                    const { message } = await BankClient.takeLoan(100000);
                    logger.info(`[DecisionEngine]: ${message}`);
                } catch {
                    logger.info(`[DecisionEngine]: Failed to take loan`);
                }                
            }else{
                if (await this.buyMaterial(state, "plastic")) {
                try {
                logger.info("[DecisionEngine]: Plastic stock low!  Buying 1000 units");
                        await OrderRawMaterialsClient.processOrderFlow({
                            name: 'plastic',
                            quantity: 1000
                        });
                    } catch {
                        logger.info("[DecisionEngine]: Failed to buy machine");
                    }
                } else {
                    logger.info("[DecisionEngine]: Plastic stock good!");
                }

                if (await this.buyMaterial(state, "aluminium")) {
                    try {
                        logger.info("[DecisionEngine]: Aluminium stock low! Buying 1000 units");
                        await OrderRawMaterialsClient.processOrderFlow({
                            name: 'aluminium',
                            quantity: 1000
                        });
                    } catch {
                        logger.info("[DecisionEngine]: Failed to buy machine");
                    }
                } else {
                    logger.info("[DecisionEngine]: Aluminium stock good!");
                }

                if (await this.buyMachine(state)) {
                    try {
                        logger.info("[DecisionEngine]: Can buy machine");
                        await OrderMachineClient.processOrderFlow(1);
                    } catch {
                        logger.info("[DecisionEngine]: Failed to buy machine");
                    }
                } else {
                    logger.info("[DecisionEngine]: Do not buy machine");
                }
            }
        }else{
            try {
                const { accountNumber } = await BankClient.createAccount({
                    notification_url: "https://case-supplier-api.projects.bbdgrad.com/api/payment",
                });
                // Store our account number
                await updateAccount(accountNumber, 0);
                logger.info(`[DecisionEngine]: Opened Bank Account: ${accountNumber}`);
            } catch {
                logger.info(`[DecisionEngine]: Failed to create account`);
            }

            // Get loan
            try {
                try {
                    const { message } = await BankClient.takeLoan(500000);
                    logger.info(`[DecisionEngine]: ${message}`);
                } catch {
                    logger.info(`[DecisionEngine]: Failed to take loan`);
                } 
            } catch {
                logger.info(`[DecisionEngine]: Failed to take loan`);
            }
        }
    }
}
