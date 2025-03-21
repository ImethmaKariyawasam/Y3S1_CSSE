import express from "express";
import {
  deletePayment,
  getPayments,
  getPaymentsUser,
  updatePayment,
  downloadReportStatus,
  downloadReportStatusByUser,
} from "../controller/payment.controller.js";

const router = express.Router();

router.post("/paymentSubmit/:id", updatePayment);
router.get("/get", getPayments);
router.get("/get/user/:id", getPaymentsUser);
router.delete("/delete/:id", deletePayment);
router.post("/downloadReportStatus", downloadReportStatus);
router.post("/downloadReportStatusUser", downloadReportStatusByUser);

export default router;
