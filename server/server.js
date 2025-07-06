import express from 'express';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { runMigrations } from './db/knex.js';
import routes from './routes/index.js';
import startSchedulers from './cron/scheduler.js';
import cors from 'cors';

import { BankClient, BulkLogistics } from './clients/index.js'; // TODO: Remove

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();
app.use(express.json());
app.use(cors());

// routes
app.use('/api', routes);

// global error handler
app.use(errorHandler);

// server startup
const startServer = async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
    });

    // startSchedulers();

    // example of using the bank client TODO: REMOVE
    const createAccount = await BankClient.createAccount();
    console.log('Account created:', createAccount.accountNumber);

    const loanResult = await BankClient.takeLoan(5000);
    console.log('Loan taken:', loanResult);

    const getBalance = await BankClient.getBalance();
    console.log('Bank balance:', getBalance.balance);

    // logistics client example use
    const pickupRequest = await BulkLogistics.createPickupRequest(
      'order-123',
      'recycler',
      [
        {
          name: 'aluminium',
          quantity: 5,
          measurementType: 'UNIT',
        },
      ]
    );

    console.log('Pickup created:\n', JSON.stringify(pickupRequest, null, 2));

    const retrieved = await BulkLogistics.getPickupRequest(pickupRequest.pickupRequestId);
    console.log('Retrieved:\n', JSON.stringify(retrieved, null, 2));

    const allCompanyRequests = await BulkLogistics.getPickupRequestsForCompany();
    console.log('All our requests:\n', JSON.stringify(allCompanyRequests, null, 2));

  } catch (err) {
    logger.error('Migrations failed', { error: err });
    logger.error('Server startup failed — exiting.');
    process.exit(1);
  }
};

startServer();
