import { schedule } from 'node-cron';
import DecisionEngine  from './jobs/decisionEngine.js';

function startSchedulers() {
    schedule('*/10 * * * * *', () => {
        const engine = new DecisionEngine();
        engine.run();
    });
};

export default startSchedulers;