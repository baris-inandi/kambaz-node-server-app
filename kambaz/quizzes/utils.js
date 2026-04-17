import { v4 as uuidv4 } from "uuid";

const todayString = (date = new Date()) => date.toISOString().split("T")[0];

const plusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return todayString(date);
};

const normalizeText = (value) => value?.toString().trim() ?? "";

const normalizeCaseInsensitive = (value) => normalizeText(value).toLowerCase();

const uniqueStrings = (values = []) =>
  Array.from(new Set(values.map(normalizeText).filter(Boolean)));

export const isFaculty = (user) =>
  user?.role === "FACULTY" || user?.role === "TA";

export const createDefaultQuiz = (courseId) => ({
  _id: uuidv4(),
  course: courseId,
  title: "New Quiz",
  description: "",
  quizType: "GRADED_QUIZ",
  assignmentGroup: "QUIZZES",
  published: false,
  shuffleAnswers: true,
  hasTimeLimit: true,
  timeLimitMinutes: 20,
  multipleAttempts: false,
  howManyAttempts: 1,
  showCorrectAnswers: "AFTER_SUBMISSION",
  accessCode: "",
  oneQuestionAtATime: true,
  webcamRequired: false,
  lockQuestionsAfterAnswering: false,
  dueDate: plusDays(7),
  availableFrom: todayString(),
  availableUntil: plusDays(7),
  questions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const calculateQuizPoints = (quiz) =>
  (quiz.questions ?? []).reduce(
    (total, question) => total + Math.max(Number(question.points) || 0, 0),
    0,
  );

export const getAttemptsAllowed = (quiz) =>
  quiz.multipleAttempts ? Math.max(Number(quiz.howManyAttempts) || 1, 1) : 1;

const parseStartOfDay = (value) =>
  value ? new Date(`${value}T00:00:00`) : null;

const parseEndOfDay = (value) => (value ? new Date(`${value}T23:59:59`) : null);

export const getAvailabilityStatus = (quiz, now = new Date()) => {
  const availableFrom = parseStartOfDay(quiz.availableFrom);
  const availableUntil = parseEndOfDay(quiz.availableUntil);

  if (availableFrom && now < availableFrom) {
    return "NOT_AVAILABLE";
  }

  if (availableUntil && now > availableUntil) {
    return "CLOSED";
  }

  return "AVAILABLE";
};

export const getTakeEligibility = (quiz, attemptsUsed, now = new Date()) => {
  if (!quiz.published) {
    return { canTake: false, reason: "UNPUBLISHED" };
  }

  const availability = getAvailabilityStatus(quiz, now);
  if (availability !== "AVAILABLE") {
    return { canTake: false, reason: availability };
  }

  if (attemptsUsed >= getAttemptsAllowed(quiz)) {
    return { canTake: false, reason: "NO_ATTEMPTS_LEFT" };
  }

  return { canTake: true, reason: null };
};

const createBaseQuestion = (question, index) => ({
  _id: question._id ?? uuidv4(),
  type: question.type ?? "MULTIPLE_CHOICE",
  title: normalizeText(question.title) || `Question ${index + 1}`,
  points: Math.max(Number(question.points) || 0, 0),
  questionHtml: question.questionHtml ?? "",
});

const normalizeMultipleChoiceQuestion = (question, index) => {
  const base = createBaseQuestion(question, index);
  const choices = (question.choices ?? []).map((choice, choiceIndex) => ({
    _id: choice._id ?? uuidv4(),
    text: choice.text ?? "",
    isCorrect: Boolean(choice.isCorrect),
  }));
  const normalizedChoices = choices.length
    ? choices
    : [
        { _id: uuidv4(), text: "", isCorrect: true },
        { _id: uuidv4(), text: "", isCorrect: false },
      ];
  const correctChoiceIndex = normalizedChoices.findIndex(
    (choice) => choice.isCorrect,
  );
  const selectedCorrectIndex = correctChoiceIndex >= 0 ? correctChoiceIndex : 0;

  return {
    ...base,
    type: "MULTIPLE_CHOICE",
    choices: normalizedChoices.map((choice, choiceIndex) => ({
      ...choice,
      isCorrect: choiceIndex === selectedCorrectIndex,
    })),
    correctAnswer: false,
    blanks: [],
  };
};

const normalizeTrueFalseQuestion = (question, index) => ({
  ...createBaseQuestion(question, index),
  type: "TRUE_FALSE",
  choices: [],
  correctAnswer: Boolean(question.correctAnswer),
  blanks: [],
});

const normalizeFillInBlankQuestion = (question, index) => ({
  ...createBaseQuestion(question, index),
  type: "FILL_IN_BLANK",
  choices: [],
  correctAnswer: false,
  blanks: (question.blanks ?? []).map((blank, blankIndex) => ({
    _id: blank._id ?? uuidv4(),
    label: normalizeText(blank.label) || `Blank ${blankIndex + 1}`,
    acceptedAnswers: uniqueStrings(blank.acceptedAnswers),
  })),
});

export const normalizeQuestions = (questions = []) =>
  (questions ?? []).map((question, index) => {
    if (question.type === "TRUE_FALSE") {
      return normalizeTrueFalseQuestion(question, index);
    }

    if (question.type === "FILL_IN_BLANK") {
      return normalizeFillInBlankQuestion(question, index);
    }

    return normalizeMultipleChoiceQuestion(question, index);
  });

export const normalizeQuizPayload = (input, existingQuiz = {}) => {
  const questions = normalizeQuestions(
    input.questions ?? existingQuiz.questions,
  );

  return {
    _id: existingQuiz._id ?? input._id ?? uuidv4(),
    course: existingQuiz.course ?? input.course,
    title: normalizeText(input.title) || existingQuiz.title || "New Quiz",
    description: input.description ?? existingQuiz.description ?? "",
    quizType: input.quizType ?? existingQuiz.quizType ?? "GRADED_QUIZ",
    assignmentGroup:
      input.assignmentGroup ?? existingQuiz.assignmentGroup ?? "QUIZZES",
    published: Boolean(input.published ?? existingQuiz.published),
    shuffleAnswers: Boolean(
      input.shuffleAnswers ?? existingQuiz.shuffleAnswers ?? true,
    ),
    hasTimeLimit: Boolean(
      input.hasTimeLimit ?? existingQuiz.hasTimeLimit ?? true,
    ),
    timeLimitMinutes: Math.max(
      Number(input.timeLimitMinutes ?? existingQuiz.timeLimitMinutes ?? 20) ||
        0,
      0,
    ),
    multipleAttempts: Boolean(
      input.multipleAttempts ?? existingQuiz.multipleAttempts,
    ),
    howManyAttempts: Math.max(
      Number(input.howManyAttempts ?? existingQuiz.howManyAttempts ?? 1) || 1,
      1,
    ),
    showCorrectAnswers:
      input.showCorrectAnswers ??
      existingQuiz.showCorrectAnswers ??
      "AFTER_SUBMISSION",
    accessCode: normalizeText(
      input.accessCode ?? existingQuiz.accessCode ?? "",
    ),
    oneQuestionAtATime: Boolean(
      input.oneQuestionAtATime ?? existingQuiz.oneQuestionAtATime ?? true,
    ),
    webcamRequired: Boolean(
      input.webcamRequired ?? existingQuiz.webcamRequired,
    ),
    lockQuestionsAfterAnswering: Boolean(
      input.lockQuestionsAfterAnswering ??
      existingQuiz.lockQuestionsAfterAnswering,
    ),
    dueDate: input.dueDate ?? existingQuiz.dueDate ?? plusDays(7),
    availableFrom:
      input.availableFrom ?? existingQuiz.availableFrom ?? todayString(),
    availableUntil:
      input.availableUntil ?? existingQuiz.availableUntil ?? plusDays(7),
    questions,
    createdAt: existingQuiz.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
};

export const buildQuizSummary = (quiz, lastAttempt = null) => ({
  _id: quiz._id,
  title: quiz.title,
  quizType: quiz.quizType,
  assignmentGroup: quiz.assignmentGroup,
  published: Boolean(quiz.published),
  dueDate: quiz.dueDate,
  availableFrom: quiz.availableFrom,
  availableUntil: quiz.availableUntil,
  questionCount: quiz.questions?.length ?? 0,
  points: calculateQuizPoints(quiz),
  lastScore: lastAttempt?.score ?? null,
  lastMaxScore: lastAttempt?.maxScore ?? null,
});

export const sanitizeQuizForStudent = (quiz) => {
  const sanitized = JSON.parse(JSON.stringify(quiz));
  sanitized.requiresAccessCode = Boolean(sanitized.accessCode);
  delete sanitized.accessCode;
  sanitized.questions = (sanitized.questions ?? []).map((question) => {
    if (question.type === "MULTIPLE_CHOICE") {
      return {
        ...question,
        choices: (question.choices ?? []).map(({ _id, text }) => ({
          _id,
          text,
        })),
      };
    }

    if (question.type === "TRUE_FALSE") {
      return {
        ...question,
        correctAnswer: undefined,
      };
    }

    return {
      ...question,
      blanks: (question.blanks ?? []).map(({ _id, label }) => ({ _id, label })),
    };
  });
  return sanitized;
};

export const sanitizeAttemptForStudent = (attempt, showCorrectAnswers) => {
  const sanitized = JSON.parse(JSON.stringify(attempt));
  if (showCorrectAnswers === "AFTER_SUBMISSION") {
    return sanitized;
  }

  sanitized.answers = (sanitized.answers ?? []).map((answer) => {
    if (answer.type === "MULTIPLE_CHOICE") {
      return {
        ...answer,
        correctChoiceId: undefined,
        choices: (answer.choices ?? []).map(({ _id, text }) => ({ _id, text })),
      };
    }

    if (answer.type === "TRUE_FALSE") {
      return {
        ...answer,
        correctTrueFalse: undefined,
      };
    }

    return {
      ...answer,
      blankResponses: (answer.blankResponses ?? []).map(
        ({ _id, label, response, isCorrect }) => ({
          _id,
          label,
          response,
          isCorrect,
        }),
      ),
    };
  });
  return sanitized;
};

export const gradeQuizSubmission = (quiz, submittedAnswers = {}) => {
  const answers = (quiz.questions ?? []).map((question) => {
    const submitted = submittedAnswers?.[question._id] ?? {};
    const points = Math.max(Number(question.points) || 0, 0);

    if (question.type === "TRUE_FALSE") {
      const selectedTrueFalse =
        submitted.selectedTrueFalse === true ||
        submitted.selectedTrueFalse === false
          ? submitted.selectedTrueFalse
          : null;
      const isCorrect =
        selectedTrueFalse !== null &&
        selectedTrueFalse === Boolean(question.correctAnswer);
      return {
        questionId: question._id,
        type: question.type,
        title: question.title,
        questionHtml: question.questionHtml,
        points,
        earnedPoints: isCorrect ? points : 0,
        isCorrect,
        choices: [],
        selectedChoiceId: "",
        correctChoiceId: "",
        selectedTrueFalse: selectedTrueFalse ?? false,
        correctTrueFalse: Boolean(question.correctAnswer),
        blankResponses: [],
      };
    }

    if (question.type === "FILL_IN_BLANK") {
      const blankResponses = (question.blanks ?? []).map((blank) => {
        const response = normalizeText(submitted.blankResponses?.[blank._id]);
        const acceptedAnswers = uniqueStrings(blank.acceptedAnswers);
        const isCorrect = acceptedAnswers.some(
          (answer) =>
            normalizeCaseInsensitive(answer) ===
            normalizeCaseInsensitive(response),
        );
        return {
          _id: blank._id,
          label: blank.label,
          response,
          acceptedAnswers,
          isCorrect,
        };
      });
      const isCorrect =
        blankResponses.length > 0 &&
        blankResponses.every((blank) => blank.isCorrect);
      return {
        questionId: question._id,
        type: question.type,
        title: question.title,
        questionHtml: question.questionHtml,
        points,
        earnedPoints: isCorrect ? points : 0,
        isCorrect,
        choices: [],
        selectedChoiceId: "",
        correctChoiceId: "",
        selectedTrueFalse: false,
        correctTrueFalse: false,
        blankResponses,
      };
    }

    const selectedChoiceId = normalizeText(submitted.selectedChoiceId);
    const correctChoice =
      (question.choices ?? []).find((choice) => choice.isCorrect) ?? null;
    const isCorrect =
      Boolean(correctChoice?._id) && selectedChoiceId === correctChoice._id;
    return {
      questionId: question._id,
      type: question.type,
      title: question.title,
      questionHtml: question.questionHtml,
      points,
      earnedPoints: isCorrect ? points : 0,
      isCorrect,
      choices: (question.choices ?? []).map((choice) => ({
        _id: choice._id,
        text: choice.text,
        isCorrect: Boolean(choice.isCorrect),
      })),
      selectedChoiceId,
      correctChoiceId: correctChoice?._id ?? "",
      selectedTrueFalse: false,
      correctTrueFalse: false,
      blankResponses: [],
    };
  });

  const score = answers.reduce(
    (total, answer) => total + answer.earnedPoints,
    0,
  );
  return {
    answers,
    score,
    maxScore: calculateQuizPoints(quiz),
  };
};
