import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.ENV === "production";

const sqs = new SQSClient({
  region: process.env.AWS_REGION || "af-south-1",
  ...(isProduction
    ? {}
    : {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      }),
});

export async function enqueuePickupRequest(payload) {
  return sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.PICKUP_QUEUE_URL,
      MessageBody: JSON.stringify(payload),
      MessageGroupId: "pickup-group-1",
      MessageDeduplicationId: `${payload.orderId}-${Date.now()}`,
    })
  );
}