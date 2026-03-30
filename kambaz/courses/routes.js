import CoursesDao from "./dao.js";
import EnrollmentsDao from "../enrollments/dao.js";

export default function CourseRoutes(app, db) {
  const dao = CoursesDao(db);
  const enrollmentsDao = EnrollmentsDao(db);

  app.get("/api/courses", (req, res) => {
    res.json(dao.findAllCourses());
  });

  app.get("/api/users/:userId/courses", (req, res) => {
    let { userId } = req.params;

    if (userId === "current") {
      const currentUser = req.session.currentUser;
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }

    res.json(dao.findCoursesForEnrolledUser(userId));
  });

  app.post("/api/users/current/courses", (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    const newCourse = dao.createCourse(req.body);
    enrollmentsDao.enrollUserInCourse(currentUser._id, newCourse._id);
    res.json(newCourse);
  });

  app.put("/api/courses/:courseId", (req, res) => {
    const updatedCourse = dao.updateCourse(req.params.courseId, req.body);
    if (!updatedCourse) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedCourse);
  });

  app.delete("/api/courses/:courseId", (req, res) => {
    res.json(dao.deleteCourse(req.params.courseId));
  });
}
