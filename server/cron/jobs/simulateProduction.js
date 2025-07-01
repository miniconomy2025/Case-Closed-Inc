import { db } from '../../db/knex.js';

const JOB_RATE_KG_PER_DAY = 1;
const CASES_PER_KG = 500;

async function simulateProduction() {

    const machines = await db('machinery').where({ active: true });

    for (const machine of machines) {
        const material = await db('materials').where({ id: machine.material_id }).first();

        if (!material || material.stock_kg < JOB_RATE_KG_PER_DAY) {
            console.log(`[SKIP] Machine ${machine.id} - not enough material`);
            continue;
        }

        const caseType = await db('cases').where({ material_id: machine.material_id })[0];

        await db('materials')
            .where({ id: material.id })
            .decrement('stock_kg', JOB_RATE_KG_PER_DAY);

        await db('cases')
            .where({ id: caseType.id })
            .increment('stock_units', CASES_PER_KG);
    
        console.log(`[PRODUCED] Machine ${machine.id} used 1kg ${material.name} to make ${CASES_PER_KG} units`);
    };
};

export default simulateProduction;
