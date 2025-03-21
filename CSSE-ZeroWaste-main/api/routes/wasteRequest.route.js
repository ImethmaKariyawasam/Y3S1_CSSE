import express from "express";
import {
  assignDriverToRequest,
  createWasteRequest,
  deleteWasteRequest,
  getWasteRequestByUserId,
  getWasteRequests,
  updateWasteRequest,
  getDriverRequests,
  downloadReport,
  handleConfirmation,
  handleFeedback,
  generateReportPickUpDateByUser,
} from "../controller/wasteRequest.controller.js";
const router = express.Router();

router.post("/create", createWasteRequest);
router.get("/get", getWasteRequests);
router.get("/get/:userId", getWasteRequestByUserId);
router.put("/update/:id", updateWasteRequest);
router.delete("/delete/:id", deleteWasteRequest);
router.put("/assign-driver/:id", assignDriverToRequest);
router.get("/getDriverRequest/:id", getDriverRequests);
router.post("/generate-report", downloadReport);
router.put("/confirm-collection", handleConfirmation);
router.put("/feedback", handleFeedback);
router.post("/generate-user-report", generateReportPickUpDateByUser);

export default router;
