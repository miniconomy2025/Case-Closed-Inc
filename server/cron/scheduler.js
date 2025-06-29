import { schedule } from 'node-cron';
import simulateProduction from './jobs/simulateProduction.js';

function startSchedulers() {
    schedule('*/1 * * * *', async () => {
        console.log(`[START] Production Job - ${new Date().toISOString()}`);
        try {
            await simulateProduction();
        } catch (err) {
            console.error('[ERROR] Production job failed:', err);
        }
    });
};

export default startSchedulers;