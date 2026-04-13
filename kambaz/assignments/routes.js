import AssignmentsDao from "./dao.js";

export default function AssignmentsRoutes(app) {
  const dao = AssignmentsDao();

  app.get("/api/courses/:courseId/assignments", async (req, res) => {
    const assignments = await dao.findAssignmentsForCourse(req.params.courseId);
    res.json(assignments);
  });

  app.get("/api/assignments/:assignmentId", async (req, res) => {
    const assignment = await dao.findAssignmentById(req.params.assignmentId);
    if (!assignment) {
      res.sendStatus(404);
      return;
    }
    res.json(assignment);
  });

  app.post("/api/courses/:courseId/assignments", async (req, res) => {
    const assignment = await dao.createAssignment({
      ...req.body,
      course: req.params.courseId,
    });
    res.json(assignment);
  });

  app.put("/api/assignments/:assignmentId", async (req, res) => {
    const updatedAssignment = await dao.updateAssignment(
      req.params.assignmentId,
      req.body,
    );
    if (!updatedAssignment) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedAssignment);
  });

  app.delete("/api/assignments/:assignmentId", async (req, res) => {
    const status = await dao.deleteAssignment(req.params.assignmentId);
    res.json(status);
  });
}
