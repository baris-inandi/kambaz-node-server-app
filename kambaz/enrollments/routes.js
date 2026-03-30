import CoursesDao from "../courses/dao.js";
import EnrollmentsDao from "./dao.js";

export default function EnrollmentsRoutes(app, db) {
  const enrollmentsDao = EnrollmentsDao(db);
  const coursesDao = CoursesDao(db);

  app.post("/api/users/current/courses/:courseId", (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    const course = coursesDao.findCourseById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const enrollment = enrollmentsDao.enrollUserInCourse(
      currentUser._id,
      req.params.courseId,
    );
    res.json(enrollment);
  });

  app.delete("/api/users/current/courses/:courseId", (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    res.json(
      enrollmentsDao.unenrollUserFromCourse(
        currentUser._id,
        req.params.courseId,
      ),
    );
  });
}
