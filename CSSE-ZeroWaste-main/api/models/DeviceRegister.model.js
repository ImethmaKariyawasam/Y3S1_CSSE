// api/models/DeviceRegister.model.js
import mongoose from "mongoose";

const deviceRegisterPersonSchema = new mongoose.Schema(
  {
    NIC: {
      type: String,
      required: true,
    },
    Phone: {
      type: String,
      required: true,
    },
    Full_Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
    },
    Location: {
      type: String,
      required: true,
    },
   
    Device_ID: {
      type: String, // Correct type for Device_ID
      required: true,
    },
    Device_Name: {
      type: String, // Correct type for Device_Name
      required: true,
    },
    Device_Type: {
      type: String, // Correct type for Device_Type
      required: true,
    },
    Created_Date: {
      type: Date,
      required: true, // Corrected 'require' to 'required'
    },
    Status: {
      type: String,
      required: true, // Corrected 'require' to 'required'
    },
  },
);

const deviceRegisterPerson = mongoose.model("DeviceRegister", deviceRegisterPersonSchema);

export default deviceRegisterPerson;
