import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    required: true,
    default: "PENDING",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  paymentDueDate: {
    type: Date,
    required: true,
  },
  paymentDate: {
    type: Date,
  },
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WasteRequest",
  },
  isAdminPayment: {
    type: Boolean,
    default: false,
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
