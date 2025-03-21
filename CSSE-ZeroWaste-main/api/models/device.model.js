import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    Device_Name: {
      type: String,
      required: true, // Corrected 'require' to 'required'
    },
    Device_ID: {
      type: String,
      required: true, // Corrected 'require' to 'required'
    },
    Device_Type: {
      type: String,
      required: true, // Corrected 'require' to 'required'
    },
    Created_Date: {
      type: Date,
      required: true, // Corrected 'require' to 'required'
    },
    User: {
      type: String,
      required: true, // Corrected 'require' to 'required'
    },
  }
);

const Device = mongoose.model("Device", deviceSchema);

export default Device;
