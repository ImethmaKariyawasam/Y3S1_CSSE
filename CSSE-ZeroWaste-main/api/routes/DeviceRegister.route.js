import express from "express"; 
import deviceRegisterPerson from "../models/DeviceRegister.model.js"; 

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

//Device Register t the Person
router.route("/Add").post((req, res) => {
const NIC = req.body.NIC;
  const Phone = req.body.Phone;
  const Full_Name = req.body.Full_Name;
  const Email = req.body.Email;
  const Location = req.body.Location;
  const Device_ID = req.body.Device_ID;
  const Device_Name = req.body.Device_Name;
  const Device_Type = req.body.Device_Type;
  const Created_Date = new Date(req.body.Created_Date); 
  const Status = req.body.Status; 


  const deviceRegister = new deviceRegisterPerson({
    NIC: NIC,
    Phone: Phone,
    Full_Name: Full_Name,
    Email: Email,
    Location:Location,
    Device_ID:Device_ID,
    Device_Name:Device_Name,
    Device_Type:Device_Type,
    Created_Date: Created_Date,
    Status:Status
  });

  deviceRegister
    .save()
    .then(() => {
      res.json("Device added successfully");
    })
    .catch((err) => {
      console.error(err); // Log the error for debugging
      res.status(500).json("Device addition unsuccessful"); // Return a 500 status code for errors
    });
});


//Registered data fetching
router.route("/").get(async (req, res) => {
  try {
    const devices = await deviceRegisterPerson.find(); 
    res.status(200).json(devices);
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ error: "Error fetching devices", details: err.message });
  }
})


router.route("/update/:id").put(async (req, res) => {
  const { id } = req.params; 
  const { Status } = req.body; 

  try {
    if (!Status) {
      return res.status(400).send({ status: "Status is required" });
    }

    const updatedDevice = await deviceRegisterPerson.findByIdAndUpdate(
      id,
      { Status }, 
      { new: true } 
    );

    if (!updatedDevice) {
      return res.status(404).send({ status: "Device not found" });
    }

    res.status(200).send({ status: "Device updated", data: updatedDevice });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error with update", error: err.message }); 
  }
});


router.route("/delete/:id").delete(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDevice = await deviceRegisterPerson.findByIdAndDelete(id); 
    if (!deletedDevice) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device deleted" });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error with delete device" }); 
  }
});


router.route("/get").get(async (req, res) => {
  const Device_ID = req.query.Device_ID; 
  try {
    const device = await DeviceRegister.find({ Device_ID: Device_ID }); 
    if (device.length === 0) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device fetched", data: device });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error fetching device" }); 
  }
});

// Get device by NIC
router.route("/getNIC").get(asyncHandler(async (req, res) => {
  const { NIC } = req.query;

  if (!NIC) {
    return res.status(400).json({ status: "NIC query parameter is required" });
  }

  const device = await deviceRegisterPerson.findOne({ NIC });

  if (!device) {
    return res.status(404).json({ status: "Device not found" });
  }

  res.status(200).json({ status: "Device fetched", data: device });
}));

export default router; 
