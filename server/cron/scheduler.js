import { schedule } from 'node-cron';
import DecisionEngine  from './jobs/decisionEngine.js';
import CancelUnpaidOrdersJob  from './jobs/canelUnpaidOrders.js';

function startSchedulers() {
    schedule('*/10 * * * * *', () => {
        const engine = new DecisionEngine();
        engine.run();
    });

    schedule('*/10 * * * * *', () => {
        const cancelJob = new CancelUnpaidOrdersJob();
        cancelJob.run();
    });
};

export default startSchedulers;