import axios from "axios";
import https from "https";
import { insertEquipmentParameters } from "../daos/equipmentParametersDao.js";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const thohApi = axios.create({
  baseURL: process.env.THOH_API_URL || "http://localhost:3002",
  timeout: 5000,
  headers: {
    'Client-Id': 'case-supplier',
  },
  httpsAgent,
});

const ThohClient = {
    async getSimulationDate() {
        try{
            const res = await thohApi.get('/current-simulation-time');
            if(res.data?.error || !res.data.simulationDate){
                return '0000-00-00';
            }else{
                return res.data.simulationDate; 
            }
        }catch{
            return '0000-00-00';
        }
    },

    async syncCaseMachineToEquipmentParameters() {
      let caseMachine = null;

      try {
        const response = await thohApi.get("/machines");
        const { machines } = response.data || {};

        if (Array.isArray(machines)) {
          caseMachine = machines.find((m) => m.machineName === "case_machine");
          if (!caseMachine) {
            console.log("[ThohClient] No 'case_machine' found in machines list. Using default machine parameters.");
          }
        } else {
          console.log("[ThohClient] No machines returned. Using default machine parameters.");
        }
      } catch (err) {
        console.log("[ThohClient] Thoh Down. Using default machine parameters.", err?.message);
      }

      await insertEquipmentParameters({
        plastic_ratio: caseMachine?.inputRatio?.plastic ?? 4,
        aluminium_ratio: caseMachine?.inputRatio?.aluminium ?? 7,
        production_rate: caseMachine?.productionRate ?? 200,
      });

      return true;
    },
};

export default ThohClient;
