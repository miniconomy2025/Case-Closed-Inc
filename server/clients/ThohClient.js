import axios from "axios";
import { insertEquipmentParameters } from "../daos/equipmentParametersDao.js";
import mtlsAgent from './mtlsAgent.js';
import logger from "../utils/logger.js";

const thohApi = axios.create({
  baseURL: process.env.THOH_API_URL || "http://localhost:3002",
  timeout: 5000,
  httpsAgent: mtlsAgent || undefined,
});

const ThohClient = {
    async getSimulationDate() {
        try{
            const res = await thohApi.get('/current-simulation-time');
            if(res.data?.error){
                return '0000-00-00';
            }else{
                return res.data.simulationDate; 
            }
        }catch{
            return '0000-00-00';
        }
    },


  async getAvailableMaterials() {
    // const res = await thohApi.get('/simulation/raw-materials');
    // return res.data;
    return [
      { rawMaterialName: "aluminium", pricePerKg: 4.5, quantityAvailable: 10 },
      { rawMaterialName: "plastic", pricePerKg: 2.2, quantityAvailable: 5 },
    ];
  },

  async placeOrder(item) {
    // const res = await thohApi.post('/simulation/purchase-raw-material', {
    //   materialName: item.name,
    //   weightQuantity: item.quantity,
    // });
    // return res.data;
    return {
      orderNumber: "mock-thoh-order-uuid-5678",
      status: "created",
      materialName: item.name,
      weightQuantity: item.quantity,
    };
  },

  async getMachinesForSale() {
    // const res = await thohApi.get('/simulation/machines');
    // return res.data;

    return {
      machines: [
        {
          machineName: "SuperPress 3000",
          quantity: 2,
          materialRatio: "1:1:6",
          productionRate: 500,
        },
        {
          machineName: "EcoMolder",
          quantity: 1,
          materialRatio: "2:2:4",
          productionRate: 300,
        },
      ],
    };
  },

  async purchaseMachine({ machineName, quantity }) {
    // const res = await thohApi.post('/simulation/purchase-machine', { machineName, quantity });
    // return res.data;
    return {
      orderId: 1234,
      machineName,
      quantity,
      price: 10000 * quantity,
      weight: 2000 * quantity,
      machineDetails: {
        requiredMaterials: "aluminium, plastic",
        materialRatio: "1:2:5",
        productionRate: 100,
      },
      bankAccount: "THOH-ACC-001",
    };
  },

  async syncCaseMachineToEquipmentParameters() {
    const response = await thohApi.get("/machines");
    const { machines } = response.data || {};

    const caseMachine = machines.find((m) => m.machineName === "case_machine");
    if (!caseMachine) {
      throw new Error("No 'case_machine' found in machines list");
    }

    await insertEquipmentParameters({
      plastic_ratio: caseMachine.inputRatio?.plastic ?? 0,
      aluminium_ratio: caseMachine.inputRatio?.aluminium ?? 0,
      production_rate: caseMachine.productionRate ?? 0,
    });
    return true;
  },
};

export default ThohClient;
