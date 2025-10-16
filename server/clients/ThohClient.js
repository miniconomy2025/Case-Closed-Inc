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

  async syncCaseMachineToEquipmentParameters() {
    const response = await thohApi.get("/machines");
    const { machines } = response.data || {};

    const caseMachine = machines.find((m) => m.machineName === "case_machine");
    if (!caseMachine) {
      throw new Error("No 'case_machine' found in machines list");
    }

    await insertEquipmentParameters({
      plastic_ratio: caseMachine.machineDetails?.inputRatio?.plastic ?? 0,
      aluminium_ratio: caseMachine.machineDetails?.inputRatio?.aluminium ?? 0,
      production_rate: caseMachine.machineDetails?.productionRate ?? 0,
    });
    return true;
  },
};

export default ThohClient;
