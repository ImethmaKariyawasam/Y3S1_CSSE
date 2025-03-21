import express from "express"; 
import Cnfirmation from "../models/Confirmation.model.js"; 

const router = express.Router();


//Add Route code
router.route("/Add").post((req, res) => {
  const NIC = req.body.NIC;
  const Device_ID = req.body.Device_ID;
  const Task = req.body.Task;
  const Reason = req.body.Reason;
  const Created_Date = new Date(req.body.Created_Date); 
  const Status = req.body.Status;

  const confirm = new Cnfirmation({
    NIC: NIC,
    Device_ID: Device_ID,
    Task: Task,
    Reason: Reason,
    Created_Date: Created_Date,
    Status:Status
  });

  confirm
    .save()
    .then(() => {
      res.json("Confirmation added successfully");
    })
    .catch((err) => {
      console.error(err); 
      res.status(500).json("Confirmation addition unsuccessful"); 
    });
});

// fetching data
router.route("/").get(async (req, res) => {
  try {
    const devices = await Cnfirmation.find(); 
    res.json(devices);
  } catch (err) {
    console.error(err); 
    res.status(500).json("Error fetching devices"); 
  }
});

// update the details
router.route("/update/:id").put(async (req, res) => {
  const { id } = req.params; 
  const NIC = req.body.NIC;
  const Device_ID = req.body.Device_ID;
  const Task = req.body.Task;
  const Reason = req.body.Reason;
  const Status = req.body.Status;


  const updateDevice = {
    NIC: NIC,
    Device_ID: Device_ID,
    Task: Task,
    Reason: Reason,
    Status:Status
  };

  try {
    const updatedDevice = await Cnfirmation.findByIdAndUpdate(id, updateDevice, { new: true }); 
    if (!updatedDevice) {
      return res.status(404).send({ status: "Device not found" });
    }
    res.status(200).send({ status: "Device updated", data: updatedDevice });
  } catch (err) {
    console.error(err); 
    res.status(500).send({ status: "Error with update" }); 
  }
});

//Delete function
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

export default router; 
