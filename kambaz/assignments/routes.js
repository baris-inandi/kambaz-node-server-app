import AssignmentsDao from "./dao.js";

export default function AssignmentsRoutes(app, db) {
  const dao = AssignmentsDao(db);

  app.get("/api/courses/:courseId/assignments", (req, res) => {
    res.json(dao.findAssignmentsForCourse(req.params.courseId));
  });

  app.get("/api/assignments/:assignmentId", (req, res) => {
    const assignment = dao.findAssignmentById(req.params.assignmentId);
    if (!assignment) {
      res.sendStatus(404);
      return;
    }
    res.json(assignment);
  });

  app.post("/api/courses/:courseId/assignments", (req, res) => {
    const assignment = dao.createAssignment({
      ...req.body,
      course: req.params.courseId,
    });
    res.json(assignment);
  });

  app.put("/api/assignments/:assignmentId", (req, res) => {
    const updatedAssignment = dao.updateAssignment(
      req.params.assignmentId,
      req.body,
    );
    if (!updatedAssignment) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedAssignment);
  });

  app.delete("/api/assignments/:assignmentId", (req, res) => {
    res.json(dao.deleteAssignment(req.params.assignmentId));
  });
}
