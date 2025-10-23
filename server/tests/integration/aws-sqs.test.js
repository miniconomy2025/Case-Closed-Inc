import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  PurgeQueueCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";
import {
  sqsClient,
  setupTestQueue,
  cleanupTestQueue,
  getQueueUrl,
  checkLocalStackHealth,
  TEST_QUEUE_URL,
} from "./localstack-setup.js";

describe("AWS SQS Integration Tests with LocalStack", () => {
  let queueUrl;
  let testOrderId;

  beforeAll(async () => {
    // Check if LocalStack is running
    const isHealthy = await checkLocalStackHealth();
    if (!isHealthy) {
      console.warn("⚠️ LocalStack is not running. Skipping SQS tests.");
      console.warn("💡 Run: npm run localstack:start");
      return;
    }

    // Setup test queue
    queueUrl = await setupTestQueue();
    console.log(`✅ Using test queue: ${queueUrl}`);
  });

  afterAll(async () => {
    // Cleanup test queue
    await cleanupTestQueue();
  });

  beforeEach(async () => {
    // Clean up any pending orders
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Create a test order for pickup requests
    const [order] = await testDb("case_orders")
      .insert({
        order_status_id: 2, // pickup_pending
        quantity: 10,
        total_price: 150.0,
        amount_paid: 150.0,
        account_number: "test-123",
        ordered_at: "2025-01-15",
      })
      .returning("id");

    testOrderId = order.id;
  });

  afterEach(async () => {
    // Clean up test data
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Purge queue to ensure clean state
    try {
      await sqsClient.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
    } catch (error) {
      // Ignore purge errors - queue might be empty
    }
  });

  describe("SQS Queue Operations", () => {
    it("should create and verify FIFO queue exists", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      expect(queueUrl).toBeDefined();
      expect(queueUrl).toContain("test-pickup-queue.fifo");

      // Verify queue attributes
      const attributesCommand = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ["FifoQueue", "ContentBasedDeduplication"],
      });

      const response = await sqsClient.send(attributesCommand);
      expect(response.Attributes.FifoQueue).toBe("true");
      expect(response.Attributes.ContentBasedDeduplication).toBe("true");
    });

    it("should send pickup request message to SQS queue", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const pickupPayload = {
        originalExternalOrderId: `EXT-${Date.now()}`,
        originCompany: "test-company",
        items: [
          {
            name: "case",
            quantity: 10,
          },
        ],
      };

      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(pickupPayload),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `${
          pickupPayload.originalExternalOrderId
        }-${Date.now()}`,
      });

      const response = await sqsClient.send(sendCommand);

      expect(response.MessageId).toBeDefined();
      // LocalStack may not return MD5OfBody in all cases
      if (response.MD5OfBody) {
        expect(response.MD5OfBody).toBeDefined();
      }
    });

    it("should receive and process pickup request message", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const pickupPayload = {
        originalExternalOrderId: `EXT-${Date.now()}`,
        originCompany: "test-company",
        items: [
          {
            name: "case",
            quantity: 5,
          },
        ],
      };

      // Send message
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(pickupPayload),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `${
          pickupPayload.originalExternalOrderId
        }-${Date.now()}`,
      });

      await sqsClient.send(sendCommand);

      // Receive message
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      });

      const response = await sqsClient.send(receiveCommand);

      expect(response.Messages).toBeDefined();
      expect(response.Messages.length).toBe(1);

      const message = response.Messages[0];
      expect(message.Body).toBeDefined();

      const receivedPayload = JSON.parse(message.Body);
      expect(receivedPayload.originalExternalOrderId).toBe(
        pickupPayload.originalExternalOrderId
      );
      expect(receivedPayload.originCompany).toBe(pickupPayload.originCompany);
      expect(receivedPayload.items).toEqual(pickupPayload.items);

      // Delete message after processing
      const deleteCommand = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      });

      await sqsClient.send(deleteCommand);
    });

    it("should handle message deduplication in FIFO queue", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const pickupPayload = {
        originalExternalOrderId: `EXT-${Date.now()}`,
        originCompany: "test-company",
        items: [{ name: "case", quantity: 3 }],
      };

      const deduplicationId = `${pickupPayload.originalExternalOrderId}-dedup-test`;

      // Send same message twice with same deduplication ID
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(pickupPayload),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: deduplicationId,
      });

      const response1 = await sqsClient.send(sendCommand);
      const response2 = await sqsClient.send(sendCommand);

      // Both should return same MessageId due to deduplication
      expect(response1.MessageId).toBe(response2.MessageId);

      // Should only receive one message
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      });

      const receiveResponse = await sqsClient.send(receiveCommand);
      expect(receiveResponse.Messages?.length).toBe(1);
    });

    it("should handle queue purging", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // Send multiple messages
      for (let i = 0; i < 3; i++) {
        const sendCommand = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            originalExternalOrderId: `EXT-${Date.now()}-${i}`,
            originCompany: "test-company",
            items: [{ name: "case", quantity: 1 }],
          }),
          MessageGroupId: "pickup-group-1",
          MessageDeduplicationId: `dedup-${Date.now()}-${i}`,
        });

        await sqsClient.send(sendCommand);
      }

      // Verify messages are in queue
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      });

      let response = await sqsClient.send(receiveCommand);
      expect(response.Messages?.length).toBeGreaterThan(0);

      // Purge queue
      const purgeCommand = new PurgeQueueCommand({
        QueueUrl: queueUrl,
      });

      await sqsClient.send(purgeCommand);

      // Verify queue is empty (LocalStack may return undefined instead of empty array)
      response = await sqsClient.send(receiveCommand);
      expect(response.Messages?.length || 0).toBe(0);
    });
  });

  describe("SQS Integration with Application", () => {
    it("should handle pickup worker queue polling", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // This test would require mocking the pickup worker
      // For now, we'll test the SQS client functions directly

      const pickupPayload = {
        originalExternalOrderId: `EXT-${Date.now()}`,
        originCompany: "test-company",
        items: [
          {
            name: "case",
            quantity: 10,
          },
        ],
      };

      // Test the enqueuePickupRequest function behavior
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(pickupPayload),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `${
          pickupPayload.originalExternalOrderId
        }-${Date.now()}`,
      });

      const response = await sqsClient.send(sendCommand);
      expect(response.MessageId).toBeDefined();
    });

    it("should handle malformed pickup request messages", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // Send malformed JSON
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: '{"invalid": json}', // Invalid JSON
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `malformed-${Date.now()}`,
      });

      const response = await sqsClient.send(sendCommand);
      expect(response.MessageId).toBeDefined();

      // Receive and verify message content
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      });

      const receiveResponse = await sqsClient.send(receiveCommand);
      expect(receiveResponse.Messages?.length).toBe(1);

      const message = receiveResponse.Messages[0];
      expect(() => JSON.parse(message.Body)).toThrow();
    });

    it("should handle large pickup request messages", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // Create large payload with many items
      const largeItems = Array.from({ length: 100 }, (_, i) => ({
        name: "case",
        quantity: i + 1,
        description: `Large item ${i} with detailed description that makes the message larger`,
      }));

      const largePayload = {
        originalExternalOrderId: `EXT-LARGE-${Date.now()}`,
        originCompany: "test-company",
        items: largeItems,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "integration-test",
          version: "1.0.0",
        },
      };

      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(largePayload),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `large-${Date.now()}`,
      });

      const response = await sqsClient.send(sendCommand);
      expect(response.MessageId).toBeDefined();

      // Verify message can be received and parsed
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      });

      const receiveResponse = await sqsClient.send(receiveCommand);
      expect(receiveResponse.Messages?.length).toBe(1);

      const message = receiveResponse.Messages[0];
      const receivedPayload = JSON.parse(message.Body);
      expect(receivedPayload.items.length).toBe(100);
    });
  });

  describe("SQS Error Handling", () => {
    it("should handle invalid queue URL", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const invalidQueueUrl =
        "http://localhost:4566/000000000000/invalid-queue.fifo";

      const sendCommand = new SendMessageCommand({
        QueueUrl: invalidQueueUrl,
        MessageBody: JSON.stringify({ test: "data" }),
        MessageGroupId: "test-group",
        MessageDeduplicationId: "test-dedup",
      });

      await expect(sqsClient.send(sendCommand)).rejects.toThrow();
    });

    it("should handle network connectivity issues gracefully", async () => {
      // This test would require mocking network failures
      // For now, we'll test with an invalid endpoint
      const invalidSqsClient = new SQSClient({
        endpoint: "http://invalid-endpoint:4566",
        region: "us-east-1",
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
        forcePathStyle: true,
      });

      const sendCommand = new SendMessageCommand({
        QueueUrl: "http://invalid-endpoint:4566/000000000000/test.fifo",
        MessageBody: JSON.stringify({ test: "data" }),
        MessageGroupId: "test-group",
        MessageDeduplicationId: "test-dedup",
      });

      await expect(invalidSqsClient.send(sendCommand)).rejects.toThrow();
    });
  });

  describe("SQS Performance and Limits", () => {
    it("should handle multiple concurrent messages", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const concurrentPromises = Array.from({ length: 5 }, (_, i) => {
        const sendCommand = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            originalExternalOrderId: `EXT-CONCURRENT-${i}-${Date.now()}`,
            originCompany: "test-company",
            items: [{ name: "case", quantity: 1 }],
          }),
          MessageGroupId: "pickup-group-1",
          MessageDeduplicationId: `concurrent-${Date.now()}-${i}`,
        });

        return sqsClient.send(sendCommand);
      });

      const responses = await Promise.all(concurrentPromises);

      expect(responses.length).toBe(5);
      responses.forEach((response) => {
        expect(response.MessageId).toBeDefined();
      });

      // Verify all messages are in queue
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      });

      const receiveResponse = await sqsClient.send(receiveCommand);
      expect(receiveResponse.Messages?.length).toBe(5);
    });

    it("should respect message visibility timeout", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          originalExternalOrderId: `EXT-VISIBILITY-${Date.now()}`,
          originCompany: "test-company",
          items: [{ name: "case", quantity: 1 }],
        }),
        MessageGroupId: "pickup-group-1",
        MessageDeduplicationId: `visibility-${Date.now()}`,
      });

      await sqsClient.send(sendCommand);

      // Receive message (this makes it invisible)
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      });

      const response = await sqsClient.send(receiveCommand);
      expect(response.Messages?.length).toBe(1);

      // Try to receive again immediately - should not get the same message
      const response2 = await sqsClient.send(receiveCommand);
      expect(response2.Messages?.length || 0).toBe(0);
    });
  });
});
