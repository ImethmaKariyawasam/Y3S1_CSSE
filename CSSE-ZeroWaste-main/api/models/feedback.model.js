import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  feedback: {
    type: String,
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
