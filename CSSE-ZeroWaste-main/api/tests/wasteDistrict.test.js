import request from "supertest";
import mongoose from "mongoose";
import District from "../models/district.model.js";
import Driver from "../models/driver.model.js";
import {app,server} from "../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_TEST_URI = uri;
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

/**
 * District tests
 */

/**
 * POST /api/district/create
 * GET /api/district/get
 * PUT /api/district/update/:id
 * DELETE /api/district/delete/:id
 *
 */
describe("POST /api/district/create", () => {
  it("should create a new district", async () => {
    const res = await request(app).post("/api/district/create").send({
      name: "Central District",
      cities: "City1, City2, City3",
      districtCode: "CD001",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Central District");
    expect(res.body.cities.length).toBe(3);
    expect(res.body.districtCode).toBe("CD001");
  });

  it("should not create district if name or cities are missing", async () => {
    const res = await request(app).post("/api/district/create").send({
      districtCode: "CD002",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Name and cities are required");
  });

  it("should not create district if no city is provided", async () => {
    const res = await request(app).post("/api/district/create").send({
      name: "Eastern District",
      cities: "",
      districtCode: "ED001",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Name and cities are required");
  });
});

describe("GET /api/district/get", () => {
  it("should get all districts", async () => {
    const district = new District({
      name: "Northern District",
      cities: ["City1", "City2"],
      districtCode: "ND001",
    });
    await district.save();

    const res = await request(app).get("/api/district/get");

    expect(res.statusCode).toEqual(200);
    expect(res.body.totalDistricts).toBe(2); // assuming one district was added before
    expect(res.body.districts[1].name).toBe("Northern District");
    expect(res.body.districts[1].cities.length).toBe(2);
  });
});

describe("PUT /api/district/update/:id", () => {
  it("should update an existing district", async () => {
    const district = new District({
      name: "Old District",
      cities: ["OldCity1", "OldCity2"],
      districtCode: "OD001",
    });
    await district.save();

    const res = await request(app)
      .put(`/api/district/update/${district._id}`)
      .send({
        name: "Updated District",
        cities: "NewCity1, NewCity2",
        districtCode: "UD001",
        isActive: "Active",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Updated District");
    expect(res.body.cities.length).toBe(2);
    expect(res.body.isActive).toBe(true);
  });

  it("should return 404 if district not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/district/update/${nonExistentId}`)
      .send({
        name: "Nonexistent District",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("District not found");
  });
});

describe("DELETE /api/district/delete/:id", () => {
  it("should delete an existing district", async () => {
    const district = new District({
      name: "ToBeDeleted District",
      cities: ["City1"],
      districtCode: "TD001",
    });
    await district.save();

    const res = await request(app).delete(
      `/api/district/delete/${district._id}`
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("ToBeDeleted District");
  });

  it("should return 404 if district not found", async () => {
    const nonExistentId = "670beb3428c8f7126e9760a2";
    const res = await request(app).delete(
      `/api/district/delete/${nonExistentId}`
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("District not found");
  });

  it("should return 400 if district has drivers", async () => {
    const driverID = new mongoose.Types.ObjectId();
    const district2 = new District({
      name: "ToBeDeleted District",
      cities: ["City1"],
      districtCode: "TD001",
    });
    await district2.save();

    const driver = new Driver({
      name: "HasDrivers Driver",
      email: "hello@gmail.com",
      phone: "hello",
      password: "password",
      NIC: "123456789V",
      vehicleImage: "image.jpg",
      DriverImage: "image.jpg",
      vehicleNumber: "WP1234",
      city: "City1",
      district: district2._id,
      isActive: true,
    });
    await driver.save();
    const district = new District({
      name: "HasDrivers District",
      cities: ["City1"],
      districtCode: "HD001",
      TruckDrivers: [driver._id],
    });
    await district.save();

    const res = await request(app).delete(
      `/api/district/delete/${district._id}`
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Delete Denied.District has drivers");
  });
});
