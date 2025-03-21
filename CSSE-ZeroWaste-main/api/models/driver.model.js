import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    NIC: {
      type: String,
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    DriverImage: {
      type: String,
      required: true,
    },
    vehicleImage: {
      type: String,
      required: true,
    },
    wasteRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WasteRequest",
      },
    ],
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },
    city: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const WasteTruck = mongoose.model("WasteTruck", driverSchema);
export default WasteTruck;
