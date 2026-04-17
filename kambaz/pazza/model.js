import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.model("PazzaPostModel", schema);
export default model;
