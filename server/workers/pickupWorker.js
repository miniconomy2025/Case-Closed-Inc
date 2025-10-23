import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import BulkLogisticsClient from "../clients/BulkLogisticsClient.js";
import BankClient from "../clients/BankClient.js";
import { updateShipmentReference } from "../daos/externalOrdersDao.js";

dotenv.config({ path: "../.env" });

const sqs = new SQSClient({ region: process.env.AWS_REGION || "af-south-1" });
const PICKUP_QUEUE_URL = process.env.PICKUP_QUEUE_URL;

// Helper sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function pollQueue() {
  console.log("[PickupWorker] Starting queue polling...");

  while (true) {
    try {
      const result = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: PICKUP_QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 10, // long polling
          VisibilityTimeout: 60, // give enough time to process before retry
        })
      );

      const messages = result.Messages || [];

      if (messages.length === 0) {
        // No messages — wait before next poll
        await sleep(2000);
        continue;
      }

      for (const msg of messages) {
        try {
          const {
            originalExternalOrderId,
            originCompany,
            items,
          } = JSON.parse(msg.Body);

          console.log("DEQUEUED MESSAGE:", {
            originalExternalOrderId,
            originCompany,
            destinationCompany: "case-supplier",
            items,
          });

          const pickupRequest = await BulkLogisticsClient.createPickupRequest(
            originalExternalOrderId,
            originCompany,
            items
          );

          console.log("Pickup request created:", pickupRequest);

          await BankClient.makePayment(
            pickupRequest.accountNumber,
            parseInt(pickupRequest.cost),
            pickupRequest.paymentReferenceId
          );

          await updateShipmentReference(
            originalExternalOrderId,
            pickupRequest.pickupRequestId
          );

          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: PICKUP_QUEUE_URL,
              ReceiptHandle: msg.ReceiptHandle,
            })
          );

          console.log(`[PickupWorker] Message processed & deleted`);
        } catch (err) {
          console.error(`[PickupWorker] Error processing message:`, err);
        }
      }
    } catch (err) {
      console.error(`[PickupWorker] Polling failed:`, err);
      // avoid hammering AWS if there's a network issue
      await sleep(5000);
    }
  }
}
