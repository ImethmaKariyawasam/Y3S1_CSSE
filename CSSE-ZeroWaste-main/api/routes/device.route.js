import express from "express"; 
import DeviceRegister from "../models/device.model.js"; 

const router = express.Router();


//Device Adding route
router.route("/Add").post((req, res) => {
  const Device_Name = req.body.Device_Name;
  const Device_ID = req.body.Device_ID;
  const Device_Type = req.body.Device_Type;
  const Created_Date = new Date(req.body.Created_Date); 
  const User = req.body.User;

  const newDevice = new DeviceRegister({
    Device_Name: Device_Name,
    Device_ID: Device_ID,
    Device_Type: Device_Type,
    Created_Date: Created_Date,
    User: User,
  });

  newDevice
    .save()
    .then(() => {
      res.json("Device added successfully");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json("Device addition unsuccessful"); 
    });
});


//data fetching function
router.route("/").get(async (req, res) => {
  try {
    const devices = await DeviceRegister.find();
    res.json(devices);
  } catch (err) {
    console.error(err); 
    res.status(500).json("Error fetching devices"); 
  }
});


//device update function in the route
router.route("/update/:id").put(async (req, res) => {
  const { id } = req.params; 
  const Device_Name = req.body.Device_Name;
  const Device_ID = req.body.Device_ID;
  const Device_Type = req.body.Device_Type;
  const Created_Date = new Date(req.body.Created_Date); 
  const User = req.body.User;

  const updateDevice = {
    Device_Name: Device_Name,
    Device_ID: Device_ID,
    Device_Type: Device_Type,
    Created_Date: Created_Date,
    User: User,
  };

  try {
    const updatedDevice = await DeviceRegister.findByIdAndUpdate(id, updateDevice, { new: true }); 
    if (!updatedDevice) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device updated", data: updatedDevice });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error with update" }); 
  }
});

//device delete function 
router.route("/delete/:id").delete(async (req, res) => {
  const { id } = req.params; 

  try {
    const deletedDevice = await DeviceRegister.findByIdAndDelete(id); 
    if (!deletedDevice) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device deleted" });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error with delete device" }); 
  }
});

// router.route("/get").get(async (req, res) => {
//   const { Device_ID } = req.query; // Destructure Device_ID directly from req.query

//   // Validate Device_ID
//   if (!Device_ID) {
//     return res.status(400).send({ status: "Device_ID is required" });
//   }

//   try {
//     const device = await DeviceRegister.findOne({ Device_ID }); // Find a device by Device_ID
//     if (!device) {
//       return res.status(404).send({ status: "Device not found" });
//     }
//     res.status(200).send({ status: "Device fetched", data: device });
//   } catch (err) {
//     console.error("Error fetching device:", err); // Log the error for debugging
//     res.status(500).send({ status: "Error fetching device", error: err.message }); // Return a 500 status code for errors
//   }
// });


//device data fetching dunction using device ID
router.route("/get/:Device_ID").get(async (req, res) => {
  const { Device_ID } = req.params; 

  if (!Device_ID) {
    return res.status(400).send({ status: "Device_ID is required" });
  }

  try {
    const device = await DeviceRegister.findOne({ Device_ID }); 
    if (!device) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device fetched", data: device });
  } catch (err) {
    console.error("Error fetching device:", err); 
    res.status(500).send({ status: "Error fetching device", error: err.message }); 
  }
});




export default router; 
