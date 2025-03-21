import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js"; 
import DeviceRegister from "../models/DeviceRegister.model.js"; 

const mongoURI = "mongodb+srv://Savindu:ubIuAhfqplwc5LcI@cluster00.ekndqnl.mongodb.net/TravelOfWorld?retryWrites=true&w=majority"; 

beforeAll(async () => {
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// we want to test the add the device 
describe("Device Registration API", () => {
  let deviceId; 

  describe("POST /api/deviceregister/Add", () => {
    it("should create a new device in the system", async () => {
      const res = await request(app).post("/api/deviceregister/Add").send({
        NIC: "123456789V",
        Phone: "1234567890",
        Full_Name: "Test User",
        Email: "testuser@example.com",
        Location: "Colombo",
        Device_ID: "DEVICE123",
        Device_Name: "Test Device",
        Device_Type: "E-Waste",
        Created_Date: new Date(),
        Status: "Active",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Device added successfully");

      const device = await DeviceRegister.findOne({ Device_ID: "DEVICE123" });
      expect(device).not.toBeNull();
      expect(device.NIC).toEqual("123456789V");
      deviceId = device._id; 
    });

    it("should not create a device with missing fields", async () => {
      const res = await request(app).post("/api/deviceregister/Add").send({
        Full_Name: "Test User",
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "File are required");
    });
  });

  describe("GET /api/deviceregister", () => {
    it("should fetch all devices", async () => {
      const res = await request(app).get("/api/deviceregister");

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0); 
    });
  });

  //we want to test the update in the device values
  describe("PUT /api/deviceregister/update/:id", () => {
    it("should update the status of a device", async () => {
      const res = await request(app).put(`/api/deviceregister/update/${deviceId}`).send({
        Status: "Inactive",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "Device updated");
      expect(res.body.data.Status).toEqual("Inactive"); 
    });

    it("should not update the device without status", async () => {
      const res = await request(app).put(`/api/deviceregister/update/${deviceId}`).send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("status", "Status is required");
    });
  });

  // we want to test the delete account in the device registration
  describe("DELETE /api/deviceregister/delete/:id", () => {
    it("should delete the device", async () => {
      const res = await request(app).delete(`/api/deviceregister/delete/${deviceId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "Device deleted");

      const deletedDevice = await DeviceRegister.findById(deviceId);
      expect(deletedDevice).toBeNull(); 
    });

    it("should return 404 for a non-existent device", async () => {
      const res = await request(app).delete(`/api/deviceregister/delete/${deviceId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("status", "Device not found");
    });
  });

  // fetch the data
  describe("GET /api/deviceregister/get", () => {
    it("should fetch a device by Device_ID", async () => {
      const res = await request(app).get("/api/deviceregister/get?Device_ID=DEVICE123");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "Device fetched");
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0); 
    });

    it("should return 404 for a non-existent Device_ID", async () => {
      const res = await request(app).get("/api/deviceregister/get?Device_ID=NON_EXISTENT_ID");

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("status", "Device not found");
    });
  });

  // fetching data using NIC
  describe("GET /api/deviceregister/getNIC", () => {
    it("should fetch a device by NIC", async () => {
      const res = await request(app).get("/api/deviceregister/getNIC?NIC=123456789V");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "Device fetched");
    });

    it("should return 400 for missing NIC", async () => {
      const res = await request(app).get("/api/deviceregister/getNIC");

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("status", "NIC query parameter is required");
    });

    it("should return 404 for a non-existent NIC", async () => {
      const res = await request(app).get("/api/deviceregister/getNIC?NIC=NON_EXISTENT_NIC");

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("status", "Device not found");
    });
  });
});
