import { v4 as uuidv4 } from "uuid";
import model from "../courses/model.js";

export default function ModulesDao() {
  const findModulesForCourse = async (courseId) => {
    const course = await model.findById(courseId);
    return course?.modules ?? [];
  };

  const createModule = async (courseId, module) => {
    const newModule = {
      _id: module._id ?? uuidv4(),
      name: module.name ?? "New Module",
      description: module.description ?? "",
      lessons: Array.isArray(module.lessons) ? module.lessons : [],
    };
    await model.updateOne({ _id: courseId }, { $push: { modules: newModule } });
    return newModule;
  };

  const deleteModule = async (courseId, moduleId) => {
    const course = await model.findById(courseId);
    if (!course) {
      return { deleted: false };
    }
    course.modules.pull({ _id: moduleId });
    await course.save();
    return { deleted: true };
  };

  const updateModule = async (courseId, moduleId, updates) => {
    const course = await model.findById(courseId);
    const module = course?.modules.id(moduleId);
    if (!module) {
      return null;
    }
    Object.assign(module, updates);
    await course.save();
    return module;
  };

  return {
    createModule,
    deleteModule,
    findModulesForCourse,
    updateModule,
  };
}
