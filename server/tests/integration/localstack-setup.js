import {
  SQSClient,
  CreateQueueCommand,
  GetQueueUrlCommand,
  DeleteQueueCommand,
  ListQueuesCommand,
} from "@aws-sdk/client-sqs";
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";

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

// Create S3 client for LocalStack
export const s3Client = new S3Client({
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

// Test bucket configuration
export const TEST_BUCKET_NAME = `test-case-documents-${Date.now()}`;

/**
 * Sets up a test SQS queue for LocalStack.
 * @returns {Promise<string>} The URL of the created queue.
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
 * Cleans up the test SQS queue.
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
 * Gets the URL of the test queue.
 * @returns {Promise<string>} The queue URL.
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
 * Sets up a test S3 bucket for LocalStack.
 * @returns {Promise<string>} The name of the created bucket.
 */
export async function setupTestBucket() {
  try {
    console.log("Setting up LocalStack S3 test bucket...");

    const createCommand = new CreateBucketCommand({
      Bucket: TEST_BUCKET_NAME,
    });

    await s3Client.send(createCommand);
    console.log(`✅ Test bucket created: ${TEST_BUCKET_NAME}`);

    return TEST_BUCKET_NAME;
  } catch (error) {
    if (error.name === "BucketAlreadyExists") {
      console.log(`✅ Test bucket already exists: ${TEST_BUCKET_NAME}`);
      return TEST_BUCKET_NAME;
    }
    console.error("❌ Failed to create test bucket:", error);
    throw error;
  }
}

/**
 * Cleans up the test S3 bucket.
 */
export async function cleanupTestBucket() {
  try {
    console.log("Cleaning up LocalStack S3 test bucket...");

    const deleteCommand = new DeleteBucketCommand({
      Bucket: TEST_BUCKET_NAME,
    });

    await s3Client.send(deleteCommand);
    console.log(`✅ Test bucket deleted: ${TEST_BUCKET_NAME}`);
  } catch (error) {
    console.error("❌ Failed to delete test bucket:", error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Checks if LocalStack is running and healthy.
 * @returns {Promise<boolean>} True if LocalStack is healthy.
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
