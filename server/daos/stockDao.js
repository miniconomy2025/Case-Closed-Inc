import { db } from "../db/knex.js";
import { getStockTypeIdByName } from "./stockTypesDao.js";

const STOCK_TABLE_NAME = 'stock'
const TYPES_TABLE_NAME = 'stock_types'
const CASES_STOCK_VIEW = 'case_stock_status'

export async function getAvailableCaseStock() { 
    //TODO: remove hard coded stock id
    return await db(CASES_STOCK_VIEW).where({ stock_id: await getStockTypeIdByName('case') }).first();
}


export async function getAvailableMaterialStockCount() {
    const plasticStock = await getStockByName('plastic');
    const aluminiumStock = await getStockByName('aluminium');
    const machineStock = await getStockByName('machine');

    const stock = {
        plastic: plasticStock.total_units + plasticStock.ordered_units, 
        aluminium: aluminiumStock.total_units + aluminiumStock.ordered_units,  
        machine: machineStock.total_units + machineStock.ordered_units
    }

    return stock;
}

export async function getStockByName(name) {
    return await db(STOCK_TABLE_NAME)
        .join(TYPES_TABLE_NAME, `${STOCK_TABLE_NAME}.stock_type_id`, `${TYPES_TABLE_NAME}.id`)
        .where(`${TYPES_TABLE_NAME}.name`, name)
        .select(`${STOCK_TABLE_NAME}.*`)
        .first();
}

export async function decrementStockByName(name, quantity) {
    const stock = await getStockByName(name);

    const newTotal = stock.total_units - quantity;
    if (newTotal < 0) {
        throw new Error(`Insufficient stock for "${name}".`);
    }

    await db(STOCK_TABLE_NAME)
        .where({ id: stock.id })
        .update({ total_units: newTotal });
};

export async function decrementStockByNameFlexible(name, quantity) {
    const stock = await getStockByName(name);

    const available = stock.total_units;
    const decrementBy = Math.min(quantity, available);

    if (decrementBy === 0) {
        throw new Error(`No stock available for "${name}".`);
    }

    await db(STOCK_TABLE_NAME)
        .where({ id: stock.id })
        .update({ total_units: available - decrementBy });
};

export async function incrementStockByName(name, quantity) {
    const stock = await getStockByName(name);
    await db(STOCK_TABLE_NAME)
        .where({ id: stock.id })
        .increment('total_units', quantity);
};

export async function increaseStockUnitsByTypeId(typeId, units, trx = db) {
    await trx(STOCK_TABLE_NAME)
        .where({ stock_type_id: typeId })
        .increment('total_units', units);
};

export async function increaseOrderedUnitsByTypeId(typeId, units, trx = db) {
    await trx(STOCK_TABLE_NAME)
        .where({ stock_type_id: typeId })
        .increment('ordered_units', units);
};

export async function decreaseStockUnitsByTypeId(typeId, units, trx = db) {
    await trx(STOCK_TABLE_NAME)
        .where({ stock_type_id: typeId })
        .decrement('total_units', units);
}

export async function deliverStockByName(name, deliveredQuantity) {
    const stock = await getStockByName(name);

    const updatedOrderedUnits = Math.max(stock.ordered_units - deliveredQuantity, 0);

    await db(STOCK_TABLE_NAME)
        .where({ id: stock.id })
        .update({
            ordered_units: updatedOrderedUnits,
        });

    await db(STOCK_TABLE_NAME)
        .where({ id: stock.id })
        .increment('total_units', deliveredQuantity);
}