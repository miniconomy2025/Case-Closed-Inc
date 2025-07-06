import BankClientReal from './BankClient.js';
import MockBankClient from './MockBankClient.js';

const mockBank = true;
const BankClient = mockBank ? MockBankClient : BankClientReal;

export { BankClient };
