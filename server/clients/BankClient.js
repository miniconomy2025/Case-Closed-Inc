import axios from 'axios';
import mtlsAgent from './mtlsAgent.js';
import logger from '../utils/logger.js';
import { getAccountNumber, updateBalance, updateAccountNumber } from '../daos/bankDetailsDao.js';


const bankApi = axios.create({
  baseURL: process.env.BANK_API_URL || "http://localhost:3003/",
  timeout: 5000,
  httpsAgent: mtlsAgent || undefined,
});

const BankClient = {
  async createAccount(notificationUrl) {
    try {
      const res = await bankApi.post('/account', { callbackURL: notificationUrl });
      return { accountNumber: res.data.account_number };
    } catch {
      logger.warn('create bank account call failed')
    }
  },

  async getMyAccount() {
    try{
        const res = await bankApi.get('/account/me');
        const accountNumber = res.data.account_number;
        const balance = res.data.net_balance;
        await updateAccountNumber(accountNumber, balance);
        return { accountNumber: accountNumber};        
    }catch {
        try{
            const { account_number } = await getAccountNumber()
            return account_number;
        }catch{
            logger.warn('No bank account active')
        }
    }

  },

  async setNotificationUrl(notificationUrl) {
    const res = await bankApi.post('/account/me/notify', { notification_url: notificationUrl });
    return { success: res.data.success };
  },

  async getBalance() {
    try {
        const res = await bankApi.get('/account/me/balance');
        const { accountNumber } = await getAccountNumber()
        await updateBalance(res.data.balance, accountNumber);

        return { balance: res.data.balance };
    } catch (error) {
        try{
            const { account_balance } = await getAccountNumber()
            return { balance: account_balance};
        }catch{
            return { balance: 0 }
        }
    };
  },

  async checkFrozen() {
    const res = await bankApi.get('/account/me/frozen');
    return { frozen: res.data.frozen };
  },

  async getOutstandingLoans() {
    const res = await bankApi.get('/account/me/loans');
    return {
      totalDue: res.data.total_due,
      loans: res.data.loans.map(l => ({
        loanNumber: l.loan_number,
        due: l.due,
      })),
    };
  },

  async takeLoan(amount) {
    const res = await bankApi.post('/loan', { amount });
    return {
      success: res.data.success,
      loanNumber: res.data.loan_number,
    };
  },

  async repayLoan(loanNumber, amount) {
    const res = await bankApi.post(`/loan/${loanNumber}/pay`, { amount });
    return {
      success: res.data.success,
      paid: res.data.paid,
    };
  },

  async getLoanDetails(loanNumber) {
    const res = await bankApi.get(`/loan/${loanNumber}`);
    return {
      loanNumber: res.data.loan_number,
      initialAmount: res.data.initial_amount,
      outstanding: res.data.outstanding,
      interestRate: res.data.interest_rate,
      startedAt: res.data.started_at,
      writeOff: res.data.write_off,
      payments: res.data.payments?.map(p => ({
        timestamp: p.timestamp,
        amount: p.amount,
        isInterest: p.is_interest,
      })),
    };
  },

  async makePayment(toAccountNumber, amount, description) {
    const res = await bankApi.post('/transaction', {
      accountNumber: (await this.getMyAccount()).accountNumber,
      to_account_number: toAccountNumber,
      to_bank_name: 'commercial-bank',
      amount: amount,
      description: description,
    });
    return {
      success: res.data.success,
      transactionNumber: res.data.transaction_number,
      status: res.data.status,
    };
  },

  async getTransactionDetails(transactionNumber) {
    const res = await bankApi.get(`/transaction/${transactionNumber}`);
    return {
      transactionNumber: res.data.transaction_number,
      from: res.data.from,
      to: res.data.to,
      amount: res.data.amount,
      description: res.data.description,
      status: res.data.status,
      timestamp: res.data.timestamp,
    };
  },

  async getTransactions(fromTimestamp, toTimestamp, onlySuccessful = true) {
    const res = await bankApi.get('/transaction', {
      params: {
        from: fromTimestamp,
        to: toTimestamp,
        only_successful: onlySuccessful,
      },
    });
    return res.data.map(tx => ({
      transactionNumber: tx.transaction_number,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      description: tx.description,
      status: tx.status,
      timestamp: tx.timestamp,
    }));
  },
};

export default BankClient;