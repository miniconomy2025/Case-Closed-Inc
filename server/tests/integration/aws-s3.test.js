import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { testDb } from "./testDb.js";
import {
  s3Client,
  setupTestBucket,
  cleanupTestBucket,
  checkLocalStackHealth,
  TEST_BUCKET_NAME,
} from "./localstack-setup.js";

describe("AWS S3 Integration Tests with LocalStack", () => {
  let bucketName;
  let testOrderId;

  beforeAll(async () => {
    // Check if LocalStack is running
    const isHealthy = await checkLocalStackHealth();
    if (!isHealthy) {
      console.warn("⚠️ LocalStack is not running. Skipping S3 tests.");
      console.warn("💡 Run: npm run localstack:start");
      return;
    }

    // Setup test bucket
    bucketName = await setupTestBucket();
    console.log(`✅ Using test bucket: ${bucketName}`);
  });

  afterAll(async () => {
    // Cleanup test bucket
    await cleanupTestBucket();
  });

  beforeEach(async () => {
    // Clean up any pending orders
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Create a test order for document storage
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
  });

  describe("S3 Bucket Operations", () => {
    it("should create and verify bucket exists", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      expect(bucketName).toBeDefined();
      expect(bucketName).toContain("test-case-documents");

      // Verify bucket exists by listing objects
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });

      const response = await s3Client.send(listCommand);
      expect(response).toBeDefined();
    });

    it("should handle bucket creation with proper naming", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // Test bucket naming convention
      expect(bucketName).toMatch(/^test-case-documents-\d+$/);
      expect(bucketName.length).toBeGreaterThan(20);
      expect(bucketName.length).toBeLessThan(64); // S3 bucket name limit
    });
  });

  describe("Case Order Document Storage", () => {
    it("should store case order invoice document", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const invoiceData = {
        orderId: testOrderId,
        orderReference: `CASE-${testOrderId}`,
        customerAccount: "test-123",
        quantity: 10,
        totalPrice: 150.0,
        amountPaid: 150.0,
        orderDate: "2025-01-15",
        status: "pickup_pending",
        items: [
          {
            name: "case",
            quantity: 10,
            unitPrice: 15.0,
          },
        ],
      };

      const key = `orders/${testOrderId}/invoice.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(invoiceData, null, 2),
        ContentType: "application/json",
        Metadata: {
          orderId: testOrderId.toString(),
          documentType: "invoice",
          createdAt: new Date().toISOString(),
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify document was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.orderId).toBe(testOrderId);
      expect(storedData.orderReference).toBe(`CASE-${testOrderId}`);
    });

    it("should store case order delivery receipt", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const receiptData = {
        orderId: testOrderId,
        deliveryDate: "2025-01-16",
        deliveredBy: "logistics-team",
        deliveryAddress: "123 Test Street, Test City",
        signature: "customer-signature-hash",
        notes: "Delivered successfully",
        photos: ["delivery-photo-1.jpg", "delivery-photo-2.jpg"],
      };

      const key = `orders/${testOrderId}/delivery-receipt.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(receiptData, null, 2),
        ContentType: "application/json",
        Metadata: {
          orderId: testOrderId.toString(),
          documentType: "delivery-receipt",
          deliveryDate: receiptData.deliveryDate,
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify receipt was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.orderId).toBe(testOrderId);
      expect(storedData.deliveryDate).toBe("2025-01-16");
    });

    it("should store case order pickup confirmation", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const pickupData = {
        orderId: testOrderId,
        pickupDate: "2025-01-17",
        pickupTime: "14:30:00",
        pickupLocation: "warehouse-dock-3",
        pickupBy: "bulk-logistics",
        itemsPickedUp: [
          {
            name: "case",
            quantity: 10,
            condition: "good",
          },
        ],
        confirmationCode: `PICKUP-${testOrderId}-${Date.now()}`,
      };

      const key = `orders/${testOrderId}/pickup-confirmation.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(pickupData, null, 2),
        ContentType: "application/json",
        Metadata: {
          orderId: testOrderId.toString(),
          documentType: "pickup-confirmation",
          pickupDate: pickupData.pickupDate,
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify pickup confirmation was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.orderId).toBe(testOrderId);
      expect(storedData.confirmationCode).toContain(`PICKUP-${testOrderId}`);
    });
  });

  describe("Logistics Document Storage", () => {
    it("should store logistics delivery manifest", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const manifestData = {
        manifestId: `MANIFEST-${Date.now()}`,
        deliveryDate: "2025-01-16",
        driver: "John Doe",
        vehicle: "TRUCK-001",
        route: "Route-A",
        orders: [
          {
            orderId: testOrderId,
            customerAddress: "123 Test Street",
            deliveryTime: "09:00-10:00",
            status: "scheduled",
          },
        ],
        totalOrders: 1,
        totalWeight: 100,
        estimatedDuration: "8 hours",
      };

      const key = `logistics/manifests/${manifestData.manifestId}.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(manifestData, null, 2),
        ContentType: "application/json",
        Metadata: {
          manifestId: manifestData.manifestId,
          documentType: "delivery-manifest",
          deliveryDate: manifestData.deliveryDate,
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify manifest was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.manifestId).toBe(manifestData.manifestId);
      expect(storedData.orders[0].orderId).toBe(testOrderId);
    });

    it("should store logistics pickup request", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const pickupRequestData = {
        requestId: `PICKUP-REQ-${Date.now()}`,
        orderId: testOrderId,
        requestedDate: "2025-01-17",
        requestedTime: "14:00-16:00",
        pickupLocation: "warehouse-dock-3",
        items: [
          {
            name: "case",
            quantity: 10,
            weight: 100,
            dimensions: "50x30x20",
          },
        ],
        specialInstructions: "Handle with care",
        contactPerson: "Warehouse Manager",
        contactPhone: "+1234567890",
      };

      const key = `logistics/pickup-requests/${pickupRequestData.requestId}.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(pickupRequestData, null, 2),
        ContentType: "application/json",
        Metadata: {
          requestId: pickupRequestData.requestId,
          documentType: "pickup-request",
          orderId: testOrderId.toString(),
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify pickup request was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.requestId).toBe(pickupRequestData.requestId);
      expect(storedData.orderId).toBe(testOrderId);
    });
  });

  describe("Report Document Storage", () => {
    it("should store daily case order report", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const reportData = {
        reportId: `DAILY-REPORT-${Date.now()}`,
        reportDate: "2025-01-15",
        reportType: "daily-case-orders",
        summary: {
          totalOrders: 1,
          totalRevenue: 150.0,
          totalQuantity: 10,
          ordersByStatus: {
            pending: 0,
            pickup_pending: 1,
            delivered: 0,
            cancelled: 0,
          },
        },
        orders: [
          {
            orderId: testOrderId,
            status: "pickup_pending",
            quantity: 10,
            totalPrice: 150.0,
            orderedAt: "2025-01-15",
          },
        ],
        generatedAt: new Date().toISOString(),
        generatedBy: "system",
      };

      const key = `reports/daily/${reportData.reportDate}/case-orders.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(reportData, null, 2),
        ContentType: "application/json",
        Metadata: {
          reportId: reportData.reportId,
          documentType: "daily-report",
          reportDate: reportData.reportDate,
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify report was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.reportId).toBe(reportData.reportId);
      expect(storedData.summary.totalOrders).toBe(1);
    });

    it("should store stock inventory report", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const inventoryData = {
        reportId: `INVENTORY-REPORT-${Date.now()}`,
        reportDate: "2025-01-15",
        reportType: "stock-inventory",
        inventory: {
          aluminium: {
            totalUnits: 500,
            availableUnits: 450,
            reservedUnits: 50,
            lastUpdated: "2025-01-15T10:00:00Z",
          },
          plastic: {
            totalUnits: 300,
            availableUnits: 280,
            reservedUnits: 20,
            lastUpdated: "2025-01-15T10:00:00Z",
          },
          machine: {
            totalUnits: 10,
            availableUnits: 8,
            reservedUnits: 2,
            lastUpdated: "2025-01-15T10:00:00Z",
          },
        },
        generatedAt: new Date().toISOString(),
        generatedBy: "system",
      };

      const key = `reports/inventory/${inventoryData.reportDate}/stock-levels.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(inventoryData, null, 2),
        ContentType: "application/json",
        Metadata: {
          reportId: inventoryData.reportId,
          documentType: "inventory-report",
          reportDate: inventoryData.reportDate,
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify inventory report was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.reportId).toBe(inventoryData.reportId);
      expect(storedData.inventory.aluminium.totalUnits).toBe(500);
    });
  });

  describe("S3 Error Handling", () => {
    it("should handle invalid bucket name", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const invalidBucketName = "invalid-bucket-name-that-does-not-exist";

      const getCommand = new GetObjectCommand({
        Bucket: invalidBucketName,
        Key: "test-key",
      });

      await expect(s3Client.send(getCommand)).rejects.toThrow();
    });

    it("should handle invalid object key", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: "non-existent-key",
      });

      await expect(s3Client.send(getCommand)).rejects.toThrow();
    });

    it("should handle network connectivity issues gracefully", async () => {
      // This test would require mocking network failures
      // For now, we'll test with an invalid endpoint
      const invalidS3Client = new S3Client({
        endpoint: "http://invalid-endpoint:4566",
        region: "us-east-1",
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
        forcePathStyle: true,
      });

      const getCommand = new GetObjectCommand({
        Bucket: "test-bucket",
        Key: "test-key",
      });

      await expect(invalidS3Client.send(getCommand)).rejects.toThrow();
    });
  });

  describe("S3 Performance and Limits", () => {
    it("should handle multiple concurrent document uploads", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      const concurrentUploads = Array.from({ length: 5 }, (_, i) => {
        const documentData = {
          orderId: testOrderId,
          documentType: `concurrent-doc-${i}`,
          content: `This is document ${i} for order ${testOrderId}`,
          timestamp: new Date().toISOString(),
        };

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: `concurrent/${testOrderId}/document-${i}.json`,
          Body: JSON.stringify(documentData, null, 2),
          ContentType: "application/json",
          Metadata: {
            orderId: testOrderId.toString(),
            documentType: `concurrent-doc-${i}`,
          },
        });

        return s3Client.send(putCommand);
      });

      const responses = await Promise.all(concurrentUploads);

      expect(responses.length).toBe(5);
      responses.forEach((response) => {
        expect(response.ETag).toBeDefined();
      });

      // Verify all documents were stored
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `concurrent/${testOrderId}/`,
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents?.length).toBe(5);
    });

    it("should handle large document uploads", async () => {
      const isHealthy = await checkLocalStackHealth();
      if (!isHealthy) {
        console.warn("⚠️ Skipping test - LocalStack not available");
        return;
      }

      // Create a large document (simulate a detailed report)
      const largeReportData = {
        reportId: `LARGE-REPORT-${Date.now()}`,
        reportDate: "2025-01-15",
        reportType: "detailed-case-analysis",
        orders: Array.from({ length: 1000 }, (_, i) => ({
          orderId: i + 1,
          status: "delivered",
          quantity: Math.floor(Math.random() * 100) + 1,
          totalPrice: Math.floor(Math.random() * 1000) + 100,
          orderedAt: "2025-01-15",
          customerDetails: {
            name: `Customer ${i + 1}`,
            address: `Address ${i + 1}`,
            phone: `+123456789${i}`,
          },
          items: [
            {
              name: "case",
              quantity: Math.floor(Math.random() * 100) + 1,
              unitPrice: 15.0,
            },
          ],
        })),
        summary: {
          totalOrders: 1000,
          totalRevenue: 500000,
          totalQuantity: 50000,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: "system",
      };

      const key = `reports/large/detailed-analysis-${Date.now()}.json`;
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(largeReportData, null, 2),
        ContentType: "application/json",
        Metadata: {
          reportId: largeReportData.reportId,
          documentType: "large-report",
          size: "large",
        },
      });

      const response = await s3Client.send(putCommand);
      expect(response.ETag).toBeDefined();

      // Verify large document was stored
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getResponse = await s3Client.send(getCommand);
      const storedData = JSON.parse(await getResponse.Body.transformToString());
      expect(storedData.orders.length).toBe(1000);
      expect(storedData.summary.totalOrders).toBe(1000);
    });
  });
});
