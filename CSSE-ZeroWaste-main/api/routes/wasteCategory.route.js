import express from "express";
import {
  createWasteCategory,
  deleteWasteCategory,
  getWasteCategories,
  updateWasteCategory,
} from "../controller/wasteCategory.controller.js";
const router = express.Router();

router.post("/create", createWasteCategory);
router.get("/get", getWasteCategories);
router.put("/update/:id", updateWasteCategory);
router.delete("/delete/:id", deleteWasteCategory);

export default router;