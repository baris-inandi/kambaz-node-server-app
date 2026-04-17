import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function EnrollmentsDao() {
  const findCoursesForUser = async (userId) => {
    const enrollments = await model.find({ user: userId }).populate("course");
    return enrollments.map((enrollment) => enrollment.course);
  };

  const findUsersForCourse = async (courseId) => {
    const enrollments = await model.find({ course: courseId }).populate("user");
    return enrollments.map((enrollment) => enrollment.user);
  };

  const isUserEnrolledInCourse = async (userId, courseId) => {
    const enrollment = await model.findOne({ user: userId, course: courseId });
    return Boolean(enrollment);
  };

  const enrollUserInCourse = async (userId, courseId) => {
    const existingEnrollment = await model.findOne({
      user: userId,
      course: courseId,
    });
    if (existingEnrollment) {
      return existingEnrollment;
    }

    return model.create({
      _id: uuidv4(),
      user: userId,
      course: courseId,
    });
  };

  const unenrollUserFromCourse = (userId, courseId) =>
    model.deleteOne({ user: userId, course: courseId });

  const unenrollAllUsersFromCourse = (courseId) =>
    model.deleteMany({ course: courseId });

  return {
    enrollUserInCourse,
    findCoursesForUser,
    findUsersForCourse,
    isUserEnrolledInCourse,
    unenrollAllUsersFromCourse,
    unenrollUserFromCourse,
  };
}
