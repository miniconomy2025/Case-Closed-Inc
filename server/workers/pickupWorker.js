import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // Adjust path if needed

import BulkLogisticsClient from "../clients/BulkLogisticsClient.js";
import BankClient from "../clients/BankClient.js";
import { updateShipmentReference } from "../daos/externalOrdersDao.js";
process.env.PGUSER = process.env.DB_USER;
process.env.PGPASSWORD = process.env.DB_PASSWORD;
process.env.PGDATABASE = process.env.DB_NAME;

console.log(
  "PGPASSWORD:",
  typeof process.env.PGPASSWORD,
  process.env.PGPASSWORD
);

const sqs = new SQSClient({ region: process.env.AWS_REGION || "af-south-1" });

const PICKUP_QUEUE_URL = process.env.PICKUP_QUEUE_URL;

async function pollQueue() {
  while (true) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: PICKUP_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10,
      })
    );
    if (Messages) {
      for (const msg of Messages) {
        const {
          originalExternalOrderId,
          originCompanyId,
          destinationCompanyId,
          items,
        } = JSON.parse(msg.Body);
        try {
          // Debug log for payload
          console.log("Pickup request payload:", {
            originalExternalOrderId,
            originCompanyId,
            destinationCompanyId,
            items,
          });
          // Try pickup and payment again
          const pickupRequest = await BulkLogisticsClient.createPickupRequest(
            originalExternalOrderId,
            originCompanyId,
            items
          );

          console.log("Pickup request sent");
          await BankClient.makePayment(
            pickupRequest.bulkLogisticsBankAccountNumber,
            pickupRequest.cost,
            pickupRequest.pickupRequestId
          );
          console.log("bank request sent");
          await updateShipmentReference(
            originalExternalOrderId,
            pickupRequest.pickupRequestId
          );
          console.log("shipment reference updated");
          // Success: delete message from queue
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: PICKUP_QUEUE_URL,
              ReceiptHandle: msg.ReceiptHandle,
            })
          );
          console.log("message deleted");
        } catch (err) {
          // Log and leave message in queue for retry
          console.error(`[PickupWorker] Retry failed: `, err);
        }
      }
    }
  }
}
pollQueue();
