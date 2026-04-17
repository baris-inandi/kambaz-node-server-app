import mongoose from "mongoose";
import schema from "./attemptSchema.js";

const model = mongoose.model("QuizAttemptModel", schema);
export default model;
