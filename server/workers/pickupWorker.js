import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import BulkLogisticsClient from "../clients/BulkLogisticsClient.js";
import BankClient from "../clients/BankClient.js";
import { updateShipmentReference } from "../daos/externalOrdersDao.js";

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
          originCompany,
          items,
        } = JSON.parse(msg.Body);
        try {
          // Debug log for payload
          console.log("Pickup request payload:", {
            originalExternalOrderId,
            originCompany,
            destinationCompany: "case-supplier",
            items,
          });
          // Try pickup and payment again
          const pickupRequest = await BulkLogisticsClient.createPickupRequest(
            originalExternalOrderId,
            originCompany,
            items
          );

          console.log("Pickup request sent");
          await BankClient.makePayment(
            pickupRequest.accountNumber,
            pickupRequest.cost,
            pickupRequest.paymentReferenceId
          );
          console.log("bank request sent");
          await updateShipmentReference(
            originalExternalOrderId,
            pickupRequest.paymentReferenceId
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