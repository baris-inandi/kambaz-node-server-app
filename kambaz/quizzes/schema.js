import mongoose from "mongoose";

const choiceSchema = new mongoose.Schema(
  {
    _id: String,
    text: String,
    isCorrect: Boolean,
  },
  { _id: false },
);

const blankSchema = new mongoose.Schema(
  {
    _id: String,
    label: String,
    acceptedAnswers: [String],
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    _id: String,
    type: {
      type: String,
      enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"],
      required: true,
    },
    title: String,
    points: Number,
    questionHtml: String,
    choices: [choiceSchema],
    correctAnswer: Boolean,
    blanks: [blankSchema],
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    _id: String,
    course: { type: String, ref: "CourseModel", required: true },
    title: String,
    description: String,
    quizType: {
      type: String,
      enum: [
        "GRADED_QUIZ",
        "PRACTICE_QUIZ",
        "GRADED_SURVEY",
        "UNGRADED_SURVEY",
      ],
      default: "GRADED_QUIZ",
    },
    assignmentGroup: {
      type: String,
      enum: ["QUIZZES", "EXAMS", "ASSIGNMENTS", "PROJECT"],
      default: "QUIZZES",
    },
    published: { type: Boolean, default: false },
    shuffleAnswers: { type: Boolean, default: true },
    hasTimeLimit: { type: Boolean, default: true },
    timeLimitMinutes: { type: Number, default: 20 },
    multipleAttempts: { type: Boolean, default: false },
    howManyAttempts: { type: Number, default: 1 },
    showCorrectAnswers: {
      type: String,
      enum: ["NEVER", "AFTER_SUBMISSION"],
      default: "AFTER_SUBMISSION",
    },
    accessCode: { type: String, default: "" },
    oneQuestionAtATime: { type: Boolean, default: true },
    webcamRequired: { type: Boolean, default: false },
    lockQuestionsAfterAnswering: { type: Boolean, default: false },
    dueDate: String,
    availableFrom: String,
    availableUntil: String,
    questions: [questionSchema],
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "quizzes" },
);

export default quizSchema;
