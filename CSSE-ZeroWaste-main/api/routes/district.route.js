import express from "express";
import {
  createDistrict,
  deleteDistrict,
  downloadDistrictReport,
  getDistricts,
  updateDistrict,
} from "../controller/district.controller.js";
const router = express.Router();

router.post("/create", createDistrict);
router.get("/get", getDistricts);
router.put("/update/:id", updateDistrict);
router.delete("/delete/:id", deleteDistrict);
router.post("/downloadDistrictReport",downloadDistrictReport)

export default router;
