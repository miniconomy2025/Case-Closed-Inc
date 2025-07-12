import {
  SQSClient,
  PurgeQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const QUEUE_URL =
  process.env.PICKUP_QUEUE_URL ||
  "https://sqs.af-south-1.amazonaws.com/263883060207/pickup-queue.fifo";
const REGION = process.env.AWS_REGION || "af-south-1";
const sqs = new SQSClient({ region: REGION });

console.log(QUEUE_URL);
console.log(REGION);

async function main() {
  // 1. Purge the queue
  console.log("Purging queue...");
  await sqs.send(new PurgeQueueCommand({ QueueUrl: QUEUE_URL }));
  console.log("Queue purged.");

  // 2. Read JSON from file
  const body = fs.readFileSync("../workers/msg.json", "utf-8");
  console.log("Sending message:", body);
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: body,
      MessageGroupId: "pickup-group-1",
      MessageDeduplicationId: "test-" + Math.floor(Math.random() * 1000000),
    })
  );
  console.log("Message sent.");

  // 3. Wait a moment for SQS to process
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Receive messages
  const { Messages } = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 2,
    })
  );
  if (!Messages) {
    console.log("No messages found in queue.");
  } else {
    console.log("Messages in queue:");
    for (const msg of Messages) {
      console.log("MessageId:", msg.MessageId);
      console.log("Body:", msg.Body);
    }
  }
}

main().catch((err) => {
  console.error("Error in SQS test script:", err);
});
