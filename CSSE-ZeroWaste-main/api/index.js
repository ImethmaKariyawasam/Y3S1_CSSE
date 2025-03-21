import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import inquiryRoutes from "./routes/inquiry.route.js";
import districtRoutes from "./routes/district.route.js";
import wasteTruckRoutes from "./routes/driver.route.js";
import wasteCategoryRoutes from "./routes/wasteCategory.route.js";
import requestRoutes from "./routes/wasteRequest.route.js";
import paymentRoutes from "./routes/payment.route.js";
import cookieParser from "cookie-parser";

mongoose
  .connect("mongodb+srv://asiri:asiri@zero-waste.e07fd.mongodb.net/?retryWrites=true&w=majority&appName=ZERO-WASTE")
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => {
    console.log(e)
    console.log("Connection failed");
  });

const app = express();

app.use(express.json());
app.use(cookieParser());
const server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/district", districtRoutes);
app.use("/api/waste-truck", wasteTruckRoutes);
app.use("/api/waste-category", wasteCategoryRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/payment", paymentRoutes);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

export { app, server };