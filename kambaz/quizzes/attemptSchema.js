import mongoose from "mongoose";

const choiceSnapshotSchema = new mongoose.Schema(
  {
    _id: String,
    text: String,
    isCorrect: Boolean,
  },
  { _id: false },
);

const blankResponseSchema = new mongoose.Schema(
  {
    _id: String,
    label: String,
    response: String,
    acceptedAnswers: [String],
    isCorrect: Boolean,
  },
  { _id: false },
);

const answerSchema = new mongoose.Schema(
  {
    questionId: String,
    type: {
      type: String,
      enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"],
    },
    title: String,
    questionHtml: String,
    points: Number,
    earnedPoints: Number,
    isCorrect: Boolean,
    choices: [choiceSnapshotSchema],
    selectedChoiceId: String,
    correctChoiceId: String,
    selectedTrueFalse: Boolean,
    correctTrueFalse: Boolean,
    blankResponses: [blankResponseSchema],
  },
  { _id: false },
);

const attemptSchema = new mongoose.Schema(
  {
    _id: String,
    quiz: { type: String, ref: "QuizModel", required: true },
    course: { type: String, ref: "CourseModel", required: true },
    student: { type: String, ref: "UserModel", required: true },
    attemptNumber: Number,
    quizTitle: String,
    score: Number,
    maxScore: Number,
    submittedAt: Date,
    answers: [answerSchema],
  },
  { collection: "quiz-attempts" },
);

export default attemptSchema;
