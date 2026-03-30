import { v4 as uuidv4 } from "uuid";

export default function EnrollmentsDao(db) {
  function isUserEnrolledInCourse(userId, courseId) {
    return db.enrollments.some(
      (enrollment) =>
        enrollment.user === userId && enrollment.course === courseId,
    );
  }

  function enrollUserInCourse(userId, courseId) {
    if (isUserEnrolledInCourse(userId, courseId)) {
      return db.enrollments.find(
        (enrollment) =>
          enrollment.user === userId && enrollment.course === courseId,
      );
    }

    const enrollment = { _id: uuidv4(), user: userId, course: courseId };
    db.enrollments.push(enrollment);
    return enrollment;
  }

  function unenrollUserFromCourse(userId, courseId) {
    const before = db.enrollments.length;
    db.enrollments = db.enrollments.filter(
      (enrollment) =>
        !(enrollment.user === userId && enrollment.course === courseId),
    );
    return { deleted: db.enrollments.length !== before };
  }

  return {
    enrollUserInCourse,
    isUserEnrolledInCourse,
    unenrollUserFromCourse,
  };
}
