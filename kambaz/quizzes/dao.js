import { v4 as uuidv4 } from "uuid";
import attemptModel from "./attemptModel.js";
import model from "./model.js";
import {
  buildQuizSummary,
  createDefaultQuiz,
  gradeQuizSubmission,
  normalizeQuizPayload,
} from "./utils.js";

export default function QuizzesDao() {
  const findQuizSummariesForCourse = async (
    courseId,
    currentUser,
    isFacultyUser,
  ) => {
    const filter = {
      course: courseId,
      ...(isFacultyUser ? {} : { published: true }),
    };
    const quizzes = await model
      .find(filter)
      .sort({ availableFrom: 1, title: 1 })
      .lean();

    if (isFacultyUser) {
      return quizzes.map((quiz) => buildQuizSummary(quiz));
    }

    const summaries = await Promise.all(
      quizzes.map(async (quiz) => {
        const latestAttempt = await attemptModel
          .findOne({ quiz: quiz._id, student: currentUser._id })
          .sort({ attemptNumber: -1 })
          .lean();
        return buildQuizSummary(quiz, latestAttempt);
      }),
    );

    return summaries;
  };

  const createQuiz = (courseId) => model.create(createDefaultQuiz(courseId));

  const findQuizById = (courseId, quizId) =>
    model.findOne({ _id: quizId, course: courseId });

  const updateQuiz = async (courseId, quizId, updates) => {
    const existingQuiz = await model
      .findOne({ _id: quizId, course: courseId })
      .lean();
    if (!existingQuiz) {
      return null;
    }

    const nextQuiz = normalizeQuizPayload(updates, existingQuiz);
    await model.updateOne(
      { _id: quizId, course: courseId },
      { $set: nextQuiz },
    );
    return model.findOne({ _id: quizId, course: courseId });
  };

  const publishQuiz = async (courseId, quizId, published) => {
    await model.updateOne(
      { _id: quizId, course: courseId },
      { $set: { published, updatedAt: new Date() } },
    );
    return model.findOne({ _id: quizId, course: courseId });
  };

  const deleteQuiz = async (courseId, quizId) => {
    await attemptModel.deleteMany({ quiz: quizId, course: courseId });
    return model.deleteOne({ _id: quizId, course: courseId });
  };

  const deleteQuizzesForCourse = async (courseId) => {
    await attemptModel.deleteMany({ course: courseId });
    return model.deleteMany({ course: courseId });
  };

  const countAttemptsForStudent = (quizId, studentId) =>
    attemptModel.countDocuments({ quiz: quizId, student: studentId });

  const findLatestAttemptForStudent = (quizId, studentId) =>
    attemptModel
      .findOne({ quiz: quizId, student: studentId })
      .sort({ attemptNumber: -1 });

  const createAttempt = async (quiz, studentId, submittedAnswers) => {
    const attemptsUsed = await countAttemptsForStudent(quiz._id, studentId);
    const graded = gradeQuizSubmission(quiz, submittedAnswers);
    return attemptModel.create({
      _id: uuidv4(),
      quiz: quiz._id,
      course: quiz.course,
      student: studentId,
      attemptNumber: attemptsUsed + 1,
      quizTitle: quiz.title,
      score: graded.score,
      maxScore: graded.maxScore,
      submittedAt: new Date(),
      answers: graded.answers,
    });
  };

  const deleteAttemptsForCourse = (courseId) =>
    attemptModel.deleteMany({ course: courseId });

  const deleteAttemptsForQuiz = (quizId) =>
    attemptModel.deleteMany({ quiz: quizId });

  return {
    countAttemptsForStudent,
    createAttempt,
    createQuiz,
    deleteAttemptsForCourse,
    deleteQuizzesForCourse,
    deleteAttemptsForQuiz,
    deleteQuiz,
    findLatestAttemptForStudent,
    findQuizById,
    findQuizSummariesForCourse,
    publishQuiz,
    updateQuiz,
  };
}
