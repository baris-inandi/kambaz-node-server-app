import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    _id: String,
    course: String,
    title: String,
    description: String,
    points: Number,
    assignmentGroup: String,
    displayGradeAs: String,
    submissionType: String,
    assignTo: String,
    availableFrom: String,
    dueDate: String,
    availableUntil: String,
  },
  { collection: "assignments" },
);

export default assignmentSchema;
