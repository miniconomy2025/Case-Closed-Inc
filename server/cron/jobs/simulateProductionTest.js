import { increaseStockUnitsByTypeId } from '../../daos/stockDao.js';
import { getStockTypeIdByName } from '../../daos/stockTypesDao.js';

async function simulateProduction() {
    console.log('Producing 1 case:')
    const typeId = await getStockTypeIdByName('case');
    if (typeId) {
        await increaseStockUnitsByTypeId(typeId, 1);
    } else {
        console.error('Stock type "case" not found.');
    };
};

export default simulateProduction;
