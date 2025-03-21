import request from "supertest";
import mongoose from "mongoose";
import WasteCategory from "../models/wasteCategory.model.js";
import WasteRequest from "../models/wasteRequest.model.js";
import {app,server} from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import District from "../models/district.model.js";

let mongoServer; // Declare mongoServer here

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect(); // Ensure we're disconnected before connecting to the new URI
  }

  // Initialize mongoServer
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_TEST_URI = uri; // Set test URI
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop(); // Stop mongoServer to clean up after tests
  server.close(); // Close the server
});

/**
 * Waste Category tests
 */

/**
 * POST /api/waste-category/create
 * GET /api/waste-category/get
 * PUT /api/waste-category/update/:id
 * DELETE /api/waste-category/delete/:id
 */

describe("POST /api/waste-category/create", () => {
  it("should create a new waste category", async () => {
    const res = await request(app).post("/api/waste-category/create").send({
      name: "Plastic",
      description: "Recyclable plastic waste",
      pricePerKg: 2.5,
      image: "image-url",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Plastic");
    expect(res.body.pricePerKg).toBe(2.5);
  });

  it("should not create waste category if required fields are missing", async () => {
    const res = await request(app).post("/api/waste-category/create").send({
      description: "Recyclable plastic waste",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Name and price per kg are required");
  });

  it("should not create waste category if name is less than 3 characters", async () => {
    const res = await request(app).post("/api/waste-category/create").send({
      name: "Pl",
      description: "Recyclable plastic waste",
      pricePerKg: 2.5,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Name should be at least 3 characters");
  });

  it("should not create waste category if description is less than 10 characters", async () => {
    const res = await request(app).post("/api/waste-category/create").send({
      name: "Plastic",
      description: "Short",
      pricePerKg: 2.5,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Description should be at least 10 characters"
    );
  });

  it("should not create waste category if price per kg is negative", async () => {
    const res = await request(app).post("/api/waste-category/create").send({
      name: "Plastic",
      description: "Recyclable plastic waste",
      pricePerKg: -5,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Price per kg should be greater than 0");
  });
});

describe("GET /api/waste-category/get", () => {
  it("should get all waste categories", async () => {
    // Add a waste category before the test
    const wasteCategory = new WasteCategory({
      name: "Paper",
      description: "Recyclable paper waste",
      pricePerKg: 1.0,
      image: "image-url",
    });
    await wasteCategory.save();

    const res = await request(app).get("/api/waste-category/get");

    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toBe(2);
    expect(res.body.wasteCategories.length).toBe(2);
    expect(res.body.wasteCategories[1].name).toBe("Paper");
  });
});

describe("PUT /api/waste-category/update/:id", () => {
  it("should update a waste category", async () => {
    // Add a waste category before the test
    const wasteCategory = new WasteCategory({
      name: "Glass",
      description: "Recyclable glass waste",
      pricePerKg: 0.8,
      image: "image-url",
    });
    await wasteCategory.save();

    const res = await request(app)
      .put(`/api/waste-category/update/${wasteCategory._id}`)
      .send({
        name: "Updated Glass",
        pricePerKg: 1.0,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Updated Glass");
    expect(res.body.pricePerKg).toBe(1.0);
  });

  let wasteCategory = "66fc34d9ad553ff3c197bb4b";
  it("should return 404 if waste category not found", async () => {
    const res = await request(app)
      .put(`/api/waste-category/update/${wasteCategory}`)
      .send({
        name: "Nonexistent",
        pricePerKg: 1.0,
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Waste category not found");
  });
});

describe("DELETE /api/waste-category/delete/:id", () => {
  it("should delete a waste category", async () => {
    const wasteCategory = new WasteCategory({
      name: "Metal",
      description: "Recyclable metal waste",
      pricePerKg: 3.0,
      image: "image-url",
    });
    await wasteCategory.save();

    const res = await request(app).delete(
      `/api/waste-category/delete/${wasteCategory._id}`
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Waste category deleted");
  });

  let wasteCategory = "66fc34d9ad553ff3c197bb4b";
  it("should return 404 if waste category not found", async () => {
    const res = await request(app).delete(
      `/api/waste-category/delete/${wasteCategory}`
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Waste category not found");
  });

  it("should not delete waste category if it is in use", async () => {
    const wasteCategory = new WasteCategory({
      name: "Metal",
      description: "Recyclable metal waste",
      pricePerKg: 3.0,
      image: "image-url",
    });
    await wasteCategory.save();

    const district = new District({
      name: "Colombo",
      cities: ["Colombo", "Dehiwala", "Mount Lavinia"],
      isActive: true,
      wasteRequests: [],
      TruckDrivers: [],
      districtCode: "CO",
    });
    await district.save();
    // Simulate that the waste category is being used in a WasteRequest
    const wasteRequest = new WasteRequest({
      wasteCategory: wasteCategory._id,
      quantity: 50,
      estimatedPrice: 150,
      pickUpDate: new Date(),
      city: "Colombo",
      address: "123, Galle Road",
      location: {
        type: "Point",
        coordinates: [79.861244, 6.927079],
      },
      district: district._id,
    });
    await wasteRequest.save();

    const res = await request(app).delete(
      `/api/waste-category/delete/${wasteCategory._id}`
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Delete Denied. Waste category is in use");
  });
});
