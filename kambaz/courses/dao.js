import { v4 as uuidv4 } from "uuid";

export default function CoursesDao(db) {
  function findAllCourses() {
    return db.courses;
  }

  function findCourseById(courseId) {
    return db.courses.find((course) => course._id === courseId);
  }

  function findCoursesForEnrolledUser(userId) {
    return db.courses.filter((course) =>
      db.enrollments.some(
        (enrollment) =>
          enrollment.user === userId && enrollment.course === course._id,
      ),
    );
  }

  function createCourse(course) {
    const newCourse = {
      _id: uuidv4(),
      number: course.number ?? "",
      name: course.name ?? "",
      description: course.description ?? "",
      startDate: course.startDate ?? "",
      endDate: course.endDate ?? "",
      image: course.image ?? "/images/reactjs.jpg",
    };
    db.courses = [...db.courses, newCourse];
    return newCourse;
  }

  function deleteCourse(courseId) {
    db.courses = db.courses.filter((course) => course._id !== courseId);
    db.enrollments = db.enrollments.filter(
      (enrollment) => enrollment.course !== courseId,
    );
    db.modules = db.modules.filter((module) => module.course !== courseId);
    db.assignments = db.assignments.filter(
      (assignment) => assignment.course !== courseId,
    );
    return { deleted: true };
  }

  function updateCourse(courseId, updates) {
    const course = db.courses.find((item) => item._id === courseId);
    if (!course) {
      return null;
    }
    Object.assign(course, updates);
    return course;
  }

  return {
    createCourse,
    deleteCourse,
    findAllCourses,
    findCourseById,
    findCoursesForEnrolledUser,
    updateCourse,
  };
}
