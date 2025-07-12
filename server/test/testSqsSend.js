import { enqueuePickupRequest } from "../utils/sqsClient.js";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.PICKUP_QUEUE_URL);

const testPayload = {
  orderId: "test-order-123",
  name: "plastic",
  quantity: 1000,
};

enqueuePickupRequest(process.env.PICKUP_QUEUE_URL, testPayload)
  .then(() => {
    console.log("Message sent to SQS successfully!");
  })
  .catch((err) => {
    console.error("Failed to send message to SQS:", err);
  });
