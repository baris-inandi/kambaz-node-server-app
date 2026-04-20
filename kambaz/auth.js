import EnrollmentsDao from "./enrollments/dao.js";

const enrollmentsDao = EnrollmentsDao();

export const isFaculty = (user) =>
  user?.role === "FACULTY" || user?.role === "TA";

export const isAdmin = (user) => user?.role === "ADMIN";

export const requireSignedInUser = (req, res) => {
  const currentUser = req.session.currentUser;
  if (!currentUser) {
    res.sendStatus(401);
    return null;
  }
  return currentUser;
};

export const requireAdminUser = (req, res) => {
  const currentUser = requireSignedInUser(req, res);
  if (!currentUser) {
    return null;
  }
  if (!isAdmin(currentUser)) {
    res.sendStatus(403);
    return null;
  }
  return currentUser;
};

export const requireFacultyUser = (req, res) => {
  const currentUser = requireSignedInUser(req, res);
  if (!currentUser) {
    return null;
  }
  if (!isFaculty(currentUser)) {
    res.sendStatus(403);
    return null;
  }
  return currentUser;
};

export const requireSelfOrAdmin = (req, res, userId) => {
  const currentUser = requireSignedInUser(req, res);
  if (!currentUser) {
    return null;
  }
  if (currentUser._id !== userId && !isAdmin(currentUser)) {
    res.sendStatus(403);
    return null;
  }
  return currentUser;
};

export const requireCourseUser = async (req, res, courseId) => {
  const currentUser = requireSignedInUser(req, res);
  if (!currentUser) {
    return null;
  }

  if (isAdmin(currentUser)) {
    return currentUser;
  }

  const isEnrolled = await enrollmentsDao.isUserEnrolledInCourse(
    currentUser._id,
    courseId,
  );
  if (!isEnrolled) {
    res.sendStatus(403);
    return null;
  }

  return currentUser;
};

export const requireFacultyCourseUser = async (req, res, courseId) => {
  const currentUser = await requireCourseUser(req, res, courseId);
  if (!currentUser) {
    return null;
  }
  if (!isFaculty(currentUser)) {
    res.sendStatus(403);
    return null;
  }
  return currentUser;
};
