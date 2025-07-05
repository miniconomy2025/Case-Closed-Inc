import axios from "axios";

const BANK_API_BASE = "http://localhost:8080";

async function testBankEndpoints() {
  try {
    // 1. Get account number
    const accountRes = await axios.get(`${BANK_API_BASE}/account/me`, {
      httpsAgent: new (
        await import("https")
      ).Agent({ rejectUnauthorized: false }),
    });
    console.log("Account number:", accountRes.data.account_number);

    // 2. Get balance
    const balanceRes = await axios.get(`${BANK_API_BASE}/account/me/balance`, {
      httpsAgent: new (
        await import("https")
      ).Agent({ rejectUnauthorized: false }),
    });
    console.log("Balance:", balanceRes.data.balance);

    // 3. Create a transaction (dummy values)
    const txRes = await axios.post(
      `${BANK_API_BASE}/transaction`,
      {
        to_account_number: "1234567890", // Replace with a real account number for a real test
        to_bank_name: "commercial-bank",
        amount: 10,
        description: "Test payment",
      },
      {
        httpsAgent: new (
          await import("https")
        ).Agent({ rejectUnauthorized: false }),
      }
    );
    console.log("Transaction result:", txRes.data);
  } catch (err) {
    console.error(
      "Bank API test error:",
      err.response ? err.response.data : err.message
    );
  }
}

testBankEndpoints();
