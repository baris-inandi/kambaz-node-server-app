import CoursesDao from "../courses/dao.js";
import EnrollmentsDao from "./dao.js";

export default function EnrollmentsRoutes(app) {
  const enrollmentsDao = EnrollmentsDao();
  const coursesDao = CoursesDao();

  app.post("/api/users/current/courses/:courseId", async (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    const course = await coursesDao.findCourseById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const enrollment = await enrollmentsDao.enrollUserInCourse(
      currentUser._id,
      req.params.courseId,
    );
    res.json(enrollment);
  });

  app.delete("/api/users/current/courses/:courseId", async (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    const status = await enrollmentsDao.unenrollUserFromCourse(
      currentUser._id,
      req.params.courseId,
    );
    res.json(status);
  });
}
