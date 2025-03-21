import mongoose from "mongoose";

const fetchdeviceSchema = new mongoose.Schema(
  {
    Device_Name: {
      type: String,
      required: true, 
    },
    Device_ID: {
      type: String,
      required: true, 
    },
    Device_Type: {
      type: String,
      required: true, 
    }
  }
);

// Explicitly specifying the collection name "DeviceData" to avoid pluralization
const FetchDeviceData = mongoose.model("FetchDevice", fetchdeviceSchema, "DeviceData");

export default FetchDeviceData;
