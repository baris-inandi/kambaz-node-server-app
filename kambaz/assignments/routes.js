import AssignmentsDao from "./dao.js";
import { requireCourseUser, requireFacultyCourseUser } from "../auth.js";

export default function AssignmentsRoutes(app) {
  const dao = AssignmentsDao();

  app.get("/api/courses/:courseId/assignments", async (req, res) => {
    const currentUser = await requireCourseUser(req, res, req.params.courseId);
    if (!currentUser) {
      return;
    }

    const assignments = await dao.findAssignmentsForCourse(req.params.courseId);
    res.json(assignments);
  });

  app.get("/api/assignments/:assignmentId", async (req, res) => {
    const assignment = await dao.findAssignmentById(req.params.assignmentId);
    if (!assignment) {
      res.sendStatus(404);
      return;
    }

    const currentUser = await requireCourseUser(req, res, assignment.course);
    if (!currentUser) {
      return;
    }

    res.json(assignment);
  });

  app.post("/api/courses/:courseId/assignments", async (req, res) => {
    const currentUser = await requireFacultyCourseUser(
      req,
      res,
      req.params.courseId,
    );
    if (!currentUser) {
      return;
    }

    const assignment = await dao.createAssignment({
      ...req.body,
      course: req.params.courseId,
    });
    res.json(assignment);
  });

  app.put("/api/assignments/:assignmentId", async (req, res) => {
    const existingAssignment = await dao.findAssignmentById(
      req.params.assignmentId,
    );
    if (!existingAssignment) {
      res.sendStatus(404);
      return;
    }

    const currentUser = await requireFacultyCourseUser(
      req,
      res,
      existingAssignment.course,
    );
    if (!currentUser) {
      return;
    }

    const updatedAssignment = await dao.updateAssignment(
      req.params.assignmentId,
      req.body,
    );
    res.json(updatedAssignment);
  });

  app.delete("/api/assignments/:assignmentId", async (req, res) => {
    const existingAssignment = await dao.findAssignmentById(
      req.params.assignmentId,
    );
    if (!existingAssignment) {
      res.sendStatus(404);
      return;
    }

    const currentUser = await requireFacultyCourseUser(
      req,
      res,
      existingAssignment.course,
    );
    if (!currentUser) {
      return;
    }

    const status = await dao.deleteAssignment(req.params.assignmentId);
    res.json(status);
  });
}
