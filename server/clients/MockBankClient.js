function generateId() {
  return 'mock-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

let mockBalance = 10000;
let mockLoans = [];
let mockTransactions = [];

const MockBankClient = {
  async createAccount() {
    return { accountNumber: 'mock-account-123' };
  },

  async getMyAccount() {
    return { accountNumber: 'mock-account-123' };
  },

  async setNotificationUrl(notificationUrl) {
    return { success: true };
  },

  async getBalance() {
    return { balance: mockBalance };
  },

  async checkFrozen() {
    return { frozen: false };
  },

  async getOutstandingLoans() {
    return {
      totalDue: mockLoans.reduce((sum, loan) => sum + loan.due, 0),
      loans: mockLoans.map(l => ({
        loanNumber: l.loanNumber,
        due: l.due,
      })),
    };
  },

  async takeLoan(amount) {
    const loan = {
      loanNumber: generateId(),
      due: amount * 1.05,
      initialAmount: amount,
      interestRate: 0.05,
      startedAt: Date.now(),
      writeOff: false,
      payments: [],
    };
    mockLoans.push(loan);
    mockBalance += amount;
    return {
      success: true,
      loanNumber: loan.loanNumber,
    };
  },

  async repayLoan(loanNumber, amount) {
    const loan = mockLoans.find(l => l.loanNumber === loanNumber);
    if (!loan) {
      return { success: false, paid: 0 };
    }

    const paidAmount = Math.min(amount, loan.due);
    loan.due -= paidAmount;
    loan.payments.push({
      timestamp: Date.now(),
      amount: paidAmount,
      isInterest: paidAmount < loan.initialAmount * 0.05,
    });
    mockBalance -= paidAmount;

    return {
      success: true,
      paid: paidAmount,
    };
  },

  async getLoanDetails(loanNumber) {
    const loan = mockLoans.find(l => l.loanNumber === loanNumber);
    if (!loan) {
      return null;
    }
    return {
      loanNumber: loan.loanNumber,
      initialAmount: loan.initialAmount,
      outstanding: loan.due,
      interestRate: loan.interestRate,
      startedAt: loan.startedAt,
      writeOff: loan.writeOff,
      payments: loan.payments,
    };
  },

  async makePayment(toAccountNumber, amount, description) {
    if (mockBalance < amount) {
      return {
        success: false,
        transactionNumber: generateId(),
        status: 'failed',
      };
    }

    mockBalance -= amount;
    const tx = {
      transactionNumber: generateId(),
      from: 'mock-account-123',
      to: toAccountNumber,
      amount,
      description,
      status: 'completed',
      timestamp: Date.now(),
    };
    mockTransactions.push(tx);

    return {
      success: true,
      transactionNumber: tx.transactionNumber,
      status: tx.status,
    };
  },

  async getTransactionDetails(transactionNumber) {
    const tx = mockTransactions.find(t => t.transactionNumber === transactionNumber);
    return tx || null;
  },

  async getTransactions(fromTimestamp, toTimestamp, onlySuccessful = true) {
    return mockTransactions.filter(tx => {
      return (
        tx.timestamp >= fromTimestamp &&
        tx.timestamp <= toTimestamp &&
        (!onlySuccessful || tx.status === 'completed')
      );
    });
  },
};

export default MockBankClient;
