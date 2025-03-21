import mongoose from "mongoose";

const confirmationSchema = new mongoose.Schema(
  {
    NIC: {
      type: String,
      required: true, 
    },
    Device_ID: {
      type: String,
      required: true, 
    },
    Task: {
      type: String,
      required: true, 
    },
    Reason: {
        type: String,
        required: true, 
      },
    Created_Date: {
      type: Date,
      required: true, 
    },
    Status: {
      type: Boolean,
      required: true, 
    },
  }
);

const Confirm = mongoose.model("Confirmation", confirmationSchema);

export default Confirm;
