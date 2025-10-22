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

    // only consider buying if stock low or balance is high
    const shouldBuy = (inventory[material] < minThreshold && demandRatio > this.thresholds.demandThreshold) || (balance > this.thresholds.excessCashThreshold);

    if (!shouldBuy) {
        return false;
    }

    // calculate the quantity needed to reach threshold
    const neededQuantity = minThreshold - inventory[material];
    if (neededQuantity <= 0) {
        return false;
    }

    // round down to nearest 1000 units (simulation constraint)
    const orderQuantity = Math.floor(neededQuantity / 1000) * 1000;
    if (orderQuantity <= 0) {
        return false;
    }

    // store quantity in state for run()
    state.materialOrderQuantity = orderQuantity;

    return true;
  }

  async buyMachine(state) {
    const { balance, inventory } = state;

    return (inventory.machine < this.thresholds.machineMin) || (balance > this.thresholds.excessCashThreshold);
  }

  async run() {
    let have_account = false;
    try{
        const { accountNumber } = await BankClient.getMyAccount();
        if (accountNumber) {
            have_account = true;
        }
        
    }catch {
        have_account = false;
    }

    if(have_account){
      const state = await this.getState();
      if(state.balance < 2000){
        try {
          const { message } = await BankClient.takeLoan(10000);
          logger.info(`[DecisionEngine]: ${message}`);
        } catch {
          logger.info(`[DecisionEngine]: Failed to take loan`);
        }
      }else{
        if (await this.buyMaterial(state, "plastic")) {
          try {
            logger.info("[DecisionEngine]: Plastic stock low! Buying stock");
            await OrderRawMaterialsClient.processOrderFlow({
              name: 'plastic',
              quantity: state.materialOrderQuantity
            });
          } catch {
            logger.info("[DecisionEngine]: Failed to buy plastic");
          }
        } else {
          logger.info("[DecisionEngine]: Plastic stock good!");
        }

        // handle aluminium
        if (await this.buyMaterial(state, "aluminium")) {
          try {
            logger.info("[DecisionEngine]: Aluminium stock low! Buying stock");
            await OrderRawMaterialsClient.processOrderFlow({
              name: 'aluminium',
              quantity: state.materialOrderQuantity
            });
          } catch {
            logger.info("[DecisionEngine]: Failed to buy aluminium");
          }
        } else {
          logger.info("[DecisionEngine]: Aluminium stock good!");
        }

        // handle machine
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
    } else {
      // create bank account
      try {
        const { accountNumber } = await BankClient.createAccount({
          notification_url: process.env.BANK_PAYMENT_URL,
        });
        await updateAccount(accountNumber, 0);
        logger.info(`[DecisionEngine]: Opened Bank Account: ${accountNumber}`);
      } catch {
        logger.info(`[DecisionEngine]: Failed to create account`);
      }

      // get loan
      try {
        const { message } = await BankClient.takeLoan(10000);
        logger.info(`[DecisionEngine]: ${message}`);
      } catch {
        logger.info(`[DecisionEngine]: Failed to take loan`);
      }
    }
  }
}
