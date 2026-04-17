import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    _id: String,
    author: String,
    bodyHtml: String,
    createdAt: Date,
    updatedAt: Date,
  },
  { _id: false },
);

const replySchema = new mongoose.Schema(
  {
    _id: String,
    author: String,
    text: String,
    createdAt: Date,
    updatedAt: Date,
  },
  { _id: false },
);

replySchema.add({
  replies: [replySchema],
});

const followupSchema = new mongoose.Schema(
  {
    _id: String,
    author: String,
    text: String,
    resolved: { type: Boolean, default: false },
    createdAt: Date,
    updatedAt: Date,
    replies: [replySchema],
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    _id: String,
    course: { type: String, ref: "CourseModel", required: true },
    type: {
      type: String,
      enum: ["QUESTION", "NOTE"],
      default: "QUESTION",
    },
    summary: { type: String, required: true },
    detailsHtml: { type: String, required: true },
    folderIds: [String],
    author: { type: String, ref: "UserModel", required: true },
    audience: {
      type: String,
      enum: ["CLASS", "INDIVIDUALS"],
      default: "CLASS",
    },
    visibleToUsers: [String],
    includeInstructors: { type: Boolean, default: false },
    viewedBy: [String],
    studentAnswers: [answerSchema],
    instructorAnswers: [answerSchema],
    followups: [followupSchema],
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "pazza-posts" },
);

export default schema;
