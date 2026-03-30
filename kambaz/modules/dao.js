import { v4 as uuidv4 } from "uuid";

export default function ModulesDao(db) {
  function findModulesForCourse(courseId) {
    return db.modules.filter((module) => module.course === courseId);
  }

  function createModule(module) {
    const newModule = {
      _id: uuidv4(),
      course: module.course,
      name: module.name ?? "New Module",
      lessons: module.lessons ?? [],
    };
    db.modules = [...db.modules, newModule];
    return newModule;
  }

  function deleteModule(moduleId) {
    db.modules = db.modules.filter((module) => module._id !== moduleId);
    return { deleted: true };
  }

  function updateModule(moduleId, updates) {
    const module = db.modules.find((item) => item._id === moduleId);
    if (!module) {
      return null;
    }
    Object.assign(module, updates);
    return module;
  }

  return {
    createModule,
    deleteModule,
    findModulesForCourse,
    updateModule,
  };
}
