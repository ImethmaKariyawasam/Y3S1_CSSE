import express from "express";
import FetchDevice from "../models/FetchDeviceData.model.js"; 
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.route("/").get(
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query; 

    const devices = await FetchDevice.find()
      .limit(limit * 1) 
      .skip((page - 1) * limit) 
      .exec();

    const count = await FetchDevice.countDocuments(); 

    res.json({
      devices, 
      totalPages: Math.ceil(count / limit), 
      currentPage: page,
    });
  })
);

// Route to fetch a device by Device_Name
router.route("/get").get(
  asyncHandler(async (req, res) => {
    const { Device_Name } = req.query;

    if (!Device_Name) {
      return res.status(400).json({ status: "Device_Name query parameter is required" });
    }

    const device = await FetchDevice.findOne({ Device_Name });

    if (!device) {
      return res.status(404).json({ status: "Device not found" });
    }

    res.status(200).json({ status: "Device fetched", data: device });
  })
);

// Global error handling middleware
router.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ status: "Internal Server Error", error: err.message });
});

export default router;
