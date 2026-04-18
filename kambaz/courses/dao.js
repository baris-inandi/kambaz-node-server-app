import { v4 as uuidv4 } from "uuid";
import AssignmentModel from "../assignments/model.js";
import PazzaPostModel from "../pazza/model.js";
import QuizzesDao from "../quizzes/dao.js";
import model from "./model.js";
import { cloneDefaultPazzaFolders } from "../pazza/defaultFolders.js";

export default function CoursesDao() {
  const quizzesDao = QuizzesDao();
  const normalizeCourseId = (courseId) =>
    typeof courseId === "string" && courseId.trim()
      ? courseId.trim()
      : uuidv4();

  const findAllCourses = () =>
    model.find({}, { _id: 1, name: 1, description: 1 });

  const findCourseById = (courseId) => model.findById(courseId);

  const createCourse = (course) =>
    model.create({
      _id: normalizeCourseId(course._id),
      number: course.number ?? "",
      name: course.name ?? "",
      description: course.description ?? "",
      startDate: course.startDate ?? "",
      endDate: course.endDate ?? "",
      image: course.image ?? "/images/reactjs.jpg",
      credits: course.credits ?? 4,
      modules: course.modules ?? [],
      pazzaFolders: course.pazzaFolders ?? cloneDefaultPazzaFolders(),
    });

  const deleteCourse = async (courseId) => {
    await AssignmentModel.deleteMany({ course: courseId });
    await PazzaPostModel.deleteMany({ course: courseId });
    await quizzesDao.deleteQuizzesForCourse(courseId);
    return model.deleteOne({ _id: courseId });
  };

  const updateCourse = async (courseId, updates) => {
    await model.updateOne({ _id: courseId }, { $set: updates });
    return model.findById(courseId);
  };

  return {
    createCourse,
    deleteCourse,
    findAllCourses,
    findCourseById,
    updateCourse,
  };
}
