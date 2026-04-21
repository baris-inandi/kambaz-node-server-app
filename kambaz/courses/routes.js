import CoursesDao from "./dao.js";
import EnrollmentsDao from "../enrollments/dao.js";
import {
  requireCourseUser,
  requireFacultyUser,
  requireSelfOrAdmin,
  requireSignedInUser,
} from "../auth.js";

export default function CourseRoutes(app) {
  const dao = CoursesDao();
  const enrollmentsDao = EnrollmentsDao();

  app.get("/api/courses", async (req, res) => {
    const courses = await dao.findAllCourses();
    res.json(courses);
  });

  app.get("/api/courses/:courseId", async (req, res) => {
    const currentUser = await requireCourseUser(req, res, req.params.courseId);
    if (!currentUser) {
      return;
    }

    const course = await dao.findCourseById(req.params.courseId);
    if (!course) {
      res.sendStatus(404);
      return;
    }
    res.json(course);
  });

  app.get("/api/users/:userId/courses", async (req, res) => {
    const currentUser = requireSignedInUser(req, res);
    if (!currentUser) {
      return;
    }

    let { userId } = req.params;

    if (userId === "current") {
      userId = currentUser._id;
    }

    const authorizedUser = requireSelfOrAdmin(req, res, userId);
    if (!authorizedUser) {
      return;
    }

    const courses = await enrollmentsDao.findCoursesForUser(userId);
    res.json(
      courses.filter(Boolean).map(({ _id, name, description }) => ({
        _id,
        name,
        description,
      })),
    );
  });

  app.get("/api/courses/:cid/users", async (req, res) => {
    const currentUser = await requireCourseUser(req, res, req.params.cid);
    if (!currentUser) {
      return;
    }

    const users = await enrollmentsDao.findUsersForCourse(req.params.cid);
    res.json(users);
  });

  app.post("/api/users/current/courses", async (req, res) => {
    const currentUser = requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const newCourse = await dao.createCourse(req.body);
    await enrollmentsDao.enrollUserInCourse(currentUser._id, newCourse._id);
    res.json(newCourse);
  });

  app.post("/api/users/current/courses/:cid", async (req, res) => {
    const currentUser = requireSignedInUser(req, res);
    if (!currentUser) {
      return;
    }

    const status = await enrollmentsDao.enrollUserInCourse(
      currentUser._id,
      req.params.cid,
    );
    res.json(status);
  });

  app.delete("/api/users/current/courses/:cid", async (req, res) => {
    const currentUser = requireSignedInUser(req, res);
    if (!currentUser) {
      return;
    }

    const status = await enrollmentsDao.unenrollUserFromCourse(
      currentUser._id,
      req.params.cid,
    );
    res.json(status);
  });

  app.post("/api/users/:uid/courses/:cid", async (req, res) => {
    const currentUser = requireSelfOrAdmin(req, res, req.params.uid);
    if (!currentUser) {
      return;
    }

    const status = await enrollmentsDao.enrollUserInCourse(
      req.params.uid,
      req.params.cid,
    );
    res.json(status);
  });

  app.delete("/api/users/:uid/courses/:cid", async (req, res) => {
    const currentUser = requireSelfOrAdmin(req, res, req.params.uid);
    if (!currentUser) {
      return;
    }

    const status = await enrollmentsDao.unenrollUserFromCourse(
      req.params.uid,
      req.params.cid,
    );
    res.json(status);
  });

  app.put("/api/courses/:courseId", async (req, res) => {
    const currentUser = requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    const updatedCourse = await dao.updateCourse(req.params.courseId, req.body);
    if (!updatedCourse) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedCourse);
  });

  app.delete("/api/courses/:courseId", async (req, res) => {
    const currentUser = requireFacultyUser(req, res);
    if (!currentUser) {
      return;
    }

    await enrollmentsDao.unenrollAllUsersFromCourse(req.params.courseId);
    const status = await dao.deleteCourse(req.params.courseId);
    res.json(status);
  });
}
