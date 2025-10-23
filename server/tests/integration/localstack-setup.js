import {
  SQSClient,
  CreateQueueCommand,
  GetQueueUrlCommand,
  DeleteQueueCommand,
} from "@aws-sdk/client-sqs";

// LocalStack configuration
const LOCALSTACK_ENDPOINT =
  process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Create SQS client for LocalStack
export const sqsClient = new SQSClient({
  endpoint: LOCALSTACK_ENDPOINT,
  region: AWS_REGION,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
});

// Test queue configuration
export const TEST_QUEUE_NAME = "test-pickup-queue.fifo";
export const TEST_QUEUE_URL = `${LOCALSTACK_ENDPOINT}/000000000000/${TEST_QUEUE_NAME}`;

/**
 * Setup LocalStack SQS queue for testing
 */
export async function setupTestQueue() {
  try {
    console.log("Setting up LocalStack SQS test queue...");

    // Create FIFO queue with required attributes
    const createCommand = new CreateQueueCommand({
      QueueName: TEST_QUEUE_NAME,
      Attributes: {
        FifoQueue: "true",
        ContentBasedDeduplication: "true",
        VisibilityTimeout: "30",
        MessageRetentionPeriod: "1209600", // 14 days
        ReceiveMessageWaitTimeSeconds: "0",
      },
    });

    await sqsClient.send(createCommand);
    console.log(`✅ Test queue created: ${TEST_QUEUE_NAME}`);

    return TEST_QUEUE_URL;
  } catch (error) {
    if (error.name === "QueueAlreadyExists") {
      console.log(`✅ Test queue already exists: ${TEST_QUEUE_NAME}`);
      return TEST_QUEUE_URL;
    }
    console.error("❌ Failed to create test queue:", error);
    throw error;
  }
}

/**
 * Clean up LocalStack SQS queue after testing
 */
export async function cleanupTestQueue() {
  try {
    console.log("Cleaning up LocalStack SQS test queue...");

    const deleteCommand = new DeleteQueueCommand({
      QueueUrl: TEST_QUEUE_URL,
    });

    await sqsClient.send(deleteCommand);
    console.log(`✅ Test queue deleted: ${TEST_QUEUE_NAME}`);
  } catch (error) {
    console.error("❌ Failed to delete test queue:", error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Get queue URL for testing
 */
export async function getQueueUrl() {
  try {
    const command = new GetQueueUrlCommand({
      QueueName: TEST_QUEUE_NAME,
    });

    const response = await sqsClient.send(command);
    return response.QueueUrl;
  } catch (error) {
    console.error("❌ Failed to get queue URL:", error);
    throw error;
  }
}

/**
 * Check if LocalStack is running
 */
export async function checkLocalStackHealth() {
  try {
    // Try to list queues to check if LocalStack is responsive
    const { ListQueuesCommand } = await import("@aws-sdk/client-sqs");
    const command = new ListQueuesCommand({});
    await sqsClient.send(command);
    return true;
  } catch (error) {
    console.error("❌ LocalStack health check failed:", error.message);
    return false;
  }
}
