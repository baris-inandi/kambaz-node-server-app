import mongoose from "mongoose";
import moduleSchema from "../modules/schema.js";

const pazzaFolderSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    number: String,
    credits: Number,
    description: String,
    startDate: String,
    endDate: String,
    image: String,
    modules: [moduleSchema],
    pazzaFolders: [pazzaFolderSchema],
  },
  { collection: "courses" },
);

export default courseSchema;
