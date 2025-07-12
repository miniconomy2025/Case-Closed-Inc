import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// const sqs = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

const sqs = new SQSClient({ region: process.env.AWS_REGION || "af-south-1" });
export async function enqueuePickupRequest(queueUrl, payload) {
  return sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageGroupId: "pickup-group-1", // required for FIFO
      MessageDeduplicationId: `${payload.orderId}-${Date.now()}`, // unique per message
    })
  );
}
