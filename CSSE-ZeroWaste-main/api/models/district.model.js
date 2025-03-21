import mongoose from "mongoose";

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    cities: [
      {
        type: String,
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    wasteRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WasteRequest",
      },
    ],
    TruckDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WasteTruck",
      },
    ],
    districtCode: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

const District = mongoose.model("District", districtSchema);

export default District;
