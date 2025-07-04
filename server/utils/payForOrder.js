import axios from "axios";

// Configurable values
const BANK_API_BASE = "https://localhost:8080"; // Replace with actual bank API URL
const TO_BANK_NAME = "commercial-bank"; // Or "retail-bank" if needed

const CASE_ACCOUNT_NUMBER = "123456";
const SUPPLIER_ACCOUNT_NUMBER = "123456";

/**
 * Pay for a supplier order via the bank API.
 * @param {string} toAccountNumber - The supplier's account number (from order response)
 * @param {number} amount - The amount to pay
 * @param {string} description - Description for the transaction
 */
export async function payForOrder(
  toAccountNumber,
  amount,
  description,
  orderID
) {
  try {
    // 1. Get your own account number
    const meRes = await axios.get(`${BANK_API_BASE}/account/me`);
    const fromAccountNumber = meRes.data.account_number;

    // 2. Create the transaction
    const txRes = await axios.post(`${BANK_API_BASE}/transaction`, {
      transaction_number: orderID,
      from: CASE_ACCOUNT_NUMBER,
      to: SUPPLIER_ACCOUNT_NUMBER,
      amount,
      description,
    });

    if (txRes.data.success) {
      console.log(
        `Payment successful! Transaction #: ${txRes.data.transaction_number}`
      );
      return txRes.data;
    } else {
      console.error("Payment failed:", txRes.data.status);
      return null;
    }
  } catch (err) {
    console.error("Error making payment:", err.message);
    return null;
  }
}
