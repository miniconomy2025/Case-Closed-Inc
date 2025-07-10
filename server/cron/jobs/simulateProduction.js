import { getEquipmentParameters } from '../../daos/equipmentParametersDao.js';
import { increaseStockUnitsByTypeId, decreaseStockUnitsByTypeId, getStockByName } from '../../daos/stockDao.js';
import { getStockTypeIdByName } from '../../daos/stockTypesDao.js';
import { db } from '../../db/knex.js';

export default class SimulateProduction{
    async run() {  
        const machines = await getStockByName('machine');

        // Validates we have machines available for production
        if (!machines || machines.total_units <= 0) {
            console.log('Skipping production: No machines available.');
            return;
        }

        const plastic = await getStockByName('plastic');
        const aluminium = await getStockByName('aluminium');

        const {
            plastic_ratio,
            aluminium_ratio,
            production_rate
        } = await getEquipmentParameters();

        const PRODUCTION_CAPACITY_PER_MACHINE = production_rate;
        const CASES_PER_BATCH = production_rate;
        const PLASTIC_PER_BATCH = plastic_ratio;
        const ALUMINIUM_PER_BATCH = aluminium_ratio; 

        // Validates we have enough materials for atleast 1 unit
        if (!plastic || plastic.total_units < PLASTIC_PER_BATCH || !aluminium || aluminium.total_units < ALUMINIUM_PER_BATCH) {
            console.log('Skipping production: Not enough raw materials available.');
            return;
        }

        const maxCasesFromMachines = PRODUCTION_CAPACITY_PER_MACHINE * machines.total_units;
        const maxBatchesFromMachines = Math.floor(maxCasesFromMachines / CASES_PER_BATCH);
        const maxBatchesFromPlastic = Math.floor(plastic.total_units / PLASTIC_PER_BATCH);
        const maxBatchesFromAluminium = Math.floor(aluminium.total_units / ALUMINIUM_PER_BATCH);

        const batchesToProduce = Math.min(maxBatchesFromMachines, maxBatchesFromPlastic, maxBatchesFromAluminium);

        // Skip if we can't produce 1 full batch (ie 4 plastic, 7 aluminium) this prevetns us dealing with decimals
        if (batchesToProduce <= 0) {
            console.log('Skipping: Not enough materials for one full batch');
            return;
        };

        const casesToProduce = batchesToProduce * CASES_PER_BATCH;

        const plasticTypeId = await getStockTypeIdByName('plastic');
        const aluminiumTypeId = await getStockTypeIdByName('aluminium');
        const caseTypeId = await getStockTypeIdByName('case');

        const totalPlasticUsed = batchesToProduce * PLASTIC_PER_BATCH;
        const totalAluminiumUsed = batchesToProduce * ALUMINIUM_PER_BATCH;

        try {
            await db.transaction(async trx => {
                await decreaseStockUnitsByTypeId(plasticTypeId, totalPlasticUsed, trx);
                await decreaseStockUnitsByTypeId(aluminiumTypeId, totalAluminiumUsed, trx);
                await increaseStockUnitsByTypeId(caseTypeId, casesToProduce, trx);
            });

            console.log(`Production complete: Produced ${casesToProduce} case(s).`);
        } catch (error) {
            console.error('Production failed during transaction:', error.message);
        }
    }
}