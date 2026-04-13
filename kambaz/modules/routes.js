import ModulesDao from "./dao.js";

export default function ModulesRoutes(app) {
  const dao = ModulesDao();

  app.get("/api/courses/:courseId/modules", async (req, res) => {
    const modules = await dao.findModulesForCourse(req.params.courseId);
    res.json(modules);
  });

  app.post("/api/courses/:courseId/modules", async (req, res) => {
    const newModule = await dao.createModule(req.params.courseId, req.body);
    res.json(newModule);
  });

  app.put("/api/courses/:courseId/modules/:moduleId", async (req, res) => {
    const updatedModule = await dao.updateModule(
      req.params.courseId,
      req.params.moduleId,
      req.body,
    );
    if (!updatedModule) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedModule);
  });

  app.delete("/api/courses/:courseId/modules/:moduleId", async (req, res) => {
    const status = await dao.deleteModule(
      req.params.courseId,
      req.params.moduleId,
    );
    res.json(status);
  });
}
