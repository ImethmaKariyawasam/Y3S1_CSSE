import mongoose from "mongoose";

const wasteRequestSchema = new mongoose.Schema({
  wasteCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WasteCategory",
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "District",
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  pickUpDate: {
    type: Date,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  requestStatus: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING",
  },
  truckDriverStatus: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING",
  },
  collectionStatus: {
    type: String,
    enum: ["PENDING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WasteTruck",
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  estimatedPrice: {
    type: Number,
    required: true,
  },
  ratingValue: {
    type: Number,
    min: 1,
    max: 5,
  },
  ratingComment: {
    type: String,
  },
});

wasteRequestSchema.index({ location: "2dsphere" });

const WasteRequest = mongoose.model("WasteRequest", wasteRequestSchema);

export default WasteRequest;
