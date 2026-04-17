import EnrollmentsDao from "../enrollments/dao.js";
import QuizzesDao from "./dao.js";
import {
  calculateQuizPoints,
  getAttemptsAllowed,
  getTakeEligibility,
  isFaculty,
  sanitizeAttemptForStudent,
  sanitizeQuizForStudent,
} from "./utils.js";

export default function QuizzesRoutes(app) {
  const quizzesDao = QuizzesDao();
  const enrollmentsDao = EnrollmentsDao();

  const requireCourseUser = async (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return null;
    }

    const isEnrolled = await enrollmentsDao.isUserEnrolledInCourse(
      currentUser._id,
      req.params.cid,
    );
    if (!isEnrolled) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  };

  const requireFacultyUser = async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return null;
    }

    if (!isFaculty(currentUser)) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  };

  const requireStudentUser = async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return null;
    }

    if (isFaculty(currentUser)) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  };

  app.get("/api/courses/:cid/quizzes", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const quizzes = await quizzesDao.findQuizSummariesForCourse(
      req.params.cid,
      currentUser,
      isFaculty(currentUser),
    );
    res.json(quizzes);
  });

  app.post("/api/courses/:cid/quizzes", async (req, res) => {
    const currentUser = await requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.createQuiz(req.params.cid);
    res.json(quiz);
  });

  app.get("/api/courses/:cid/quizzes/:qid", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.findQuizById(req.params.cid, req.params.qid);
    if (!quiz) {
      res.sendStatus(404);
      return;
    }

    if (!isFaculty(currentUser) && !quiz.published) {
      res.sendStatus(404);
      return;
    }

    const points = calculateQuizPoints(quiz);
    const questionCount = quiz.questions?.length ?? 0;

    if (isFaculty(currentUser)) {
      res.json({
        ...quiz.toObject(),
        points,
        questionCount,
      });
      return;
    }

    const attemptsUsed = await quizzesDao.countAttemptsForStudent(
      quiz._id,
      currentUser._id,
    );
    const latestAttempt = await quizzesDao.findLatestAttemptForStudent(
      quiz._id,
      currentUser._id,
    );
    const attemptsAllowed = getAttemptsAllowed(quiz);
    const eligibility = getTakeEligibility(quiz, attemptsUsed);

    res.json({
      ...sanitizeQuizForStudent(quiz.toObject()),
      points,
      questionCount,
      attemptsAllowed,
      attemptsUsed,
      attemptsRemaining: Math.max(attemptsAllowed - attemptsUsed, 0),
      canTake: eligibility.canTake,
      takeBlockedReason: eligibility.reason,
      latestAttemptSummary: latestAttempt
        ? {
            attemptNumber: latestAttempt.attemptNumber,
            score: latestAttempt.score,
            maxScore: latestAttempt.maxScore,
            submittedAt: latestAttempt.submittedAt,
          }
        : null,
    });
  });

  app.put("/api/courses/:cid/quizzes/:qid", async (req, res) => {
    const currentUser = await requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.updateQuiz(
      req.params.cid,
      req.params.qid,
      req.body,
    );
    if (!quiz) {
      res.sendStatus(404);
      return;
    }

    res.json(quiz);
  });

  app.delete("/api/courses/:cid/quizzes/:qid", async (req, res) => {
    const currentUser = await requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const status = await quizzesDao.deleteQuiz(req.params.cid, req.params.qid);
    res.json(status);
  });

  app.post("/api/courses/:cid/quizzes/:qid/publish", async (req, res) => {
    const currentUser = await requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.publishQuiz(
      req.params.cid,
      req.params.qid,
      true,
    );
    if (!quiz) {
      res.sendStatus(404);
      return;
    }

    res.json(quiz);
  });

  app.post("/api/courses/:cid/quizzes/:qid/unpublish", async (req, res) => {
    const currentUser = await requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.publishQuiz(
      req.params.cid,
      req.params.qid,
      false,
    );
    if (!quiz) {
      res.sendStatus(404);
      return;
    }

    res.json(quiz);
  });

  app.get(
    "/api/courses/:cid/quizzes/:qid/attempts/latest",
    async (req, res) => {
      const currentUser = await requireStudentUser(req, res);
      if (!currentUser) {
        return;
      }

      const quiz = await quizzesDao.findQuizById(
        req.params.cid,
        req.params.qid,
      );
      if (!quiz || !quiz.published) {
        res.sendStatus(404);
        return;
      }

      const latestAttempt = await quizzesDao.findLatestAttemptForStudent(
        quiz._id,
        currentUser._id,
      );
      if (!latestAttempt) {
        res.sendStatus(404);
        return;
      }

      res.json(
        sanitizeAttemptForStudent(
          latestAttempt.toObject(),
          quiz.showCorrectAnswers,
        ),
      );
    },
  );

  app.post("/api/courses/:cid/quizzes/:qid/access", async (req, res) => {
    const currentUser = await requireStudentUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.findQuizById(req.params.cid, req.params.qid);
    if (!quiz || !quiz.published) {
      res.sendStatus(404);
      return;
    }

    const attemptsUsed = await quizzesDao.countAttemptsForStudent(
      quiz._id,
      currentUser._id,
    );
    const eligibility = getTakeEligibility(quiz, attemptsUsed);
    if (!eligibility.canTake) {
      res.status(400).json({ message: eligibility.reason });
      return;
    }

    if (quiz.accessCode && quiz.accessCode !== (req.body.accessCode ?? "")) {
      res.status(400).json({ message: "INVALID_ACCESS_CODE" });
      return;
    }

    res.json({ ok: true });
  });

  app.post("/api/courses/:cid/quizzes/:qid/attempts", async (req, res) => {
    const currentUser = await requireStudentUser(req, res);
    if (!currentUser) {
      return;
    }

    const quiz = await quizzesDao.findQuizById(req.params.cid, req.params.qid);
    if (!quiz || !quiz.published) {
      res.sendStatus(404);
      return;
    }

    const attemptsUsed = await quizzesDao.countAttemptsForStudent(
      quiz._id,
      currentUser._id,
    );
    const eligibility = getTakeEligibility(quiz, attemptsUsed);
    if (!eligibility.canTake) {
      res.status(400).json({ message: eligibility.reason });
      return;
    }

    if (quiz.accessCode && quiz.accessCode !== (req.body.accessCode ?? "")) {
      res.status(400).json({ message: "INVALID_ACCESS_CODE" });
      return;
    }

    const attempt = await quizzesDao.createAttempt(
      quiz,
      currentUser._id,
      req.body.answers ?? {},
    );

    res.json(
      sanitizeAttemptForStudent(attempt.toObject(), quiz.showCorrectAnswers),
    );
  });
}
