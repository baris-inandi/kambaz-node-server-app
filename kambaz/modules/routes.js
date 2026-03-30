import ModulesDao from "./dao.js";

export default function ModulesRoutes(app, db) {
  const dao = ModulesDao(db);

  app.get("/api/courses/:courseId/modules", (req, res) => {
    res.json(dao.findModulesForCourse(req.params.courseId));
  });

  app.post("/api/courses/:courseId/modules", (req, res) => {
    const newModule = dao.createModule({
      ...req.body,
      course: req.params.courseId,
    });
    res.json(newModule);
  });

  app.put("/api/modules/:moduleId", (req, res) => {
    const updatedModule = dao.updateModule(req.params.moduleId, req.body);
    if (!updatedModule) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedModule);
  });

  app.delete("/api/modules/:moduleId", (req, res) => {
    res.json(dao.deleteModule(req.params.moduleId));
  });
}
