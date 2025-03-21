import express from "express";
import { test, signout, updateUser, deleteUser, getusers, getUser } from "../controller/user.controller.js";
import { verifyToken } from "../utils/verifyUser.js";
const router = express.Router();

router.get("/test", test);
router.put("/update/:userId",updateUser);
router.delete("/delete/:userId",deleteUser);
router.get("/getusers", getusers);
router.get('/:userId',getUser);
router.post("/signout", signout);
export default router;
