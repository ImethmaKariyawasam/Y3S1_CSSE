import express from "express";
import {
  createDriver,
  deleteDriver,
  generateDistrictReport,
  getDrivers,
  updateDriver,
} from "../controller/driver.controller.js";

const router = express.Router();

router.post("/create", createDriver);
router.get("/get", getDrivers);
router.put("/update/:id", updateDriver);
router.delete("/delete/:id", deleteDriver);
router.post("/generate-district-report", generateDistrictReport);

export default router;