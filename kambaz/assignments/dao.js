import { v4 as uuidv4 } from "uuid";

export default function AssignmentsDao(db) {
  function findAssignmentsForCourse(courseId) {
    return db.assignments.filter(
      (assignment) => assignment.course === courseId,
    );
  }

  function findAssignmentById(assignmentId) {
    return db.assignments.find((assignment) => assignment._id === assignmentId);
  }

  function createAssignment(assignment) {
    const newAssignment = {
      _id: uuidv4(),
      course: assignment.course,
      title: assignment.title ?? "",
      description: assignment.description ?? "",
      points: assignment.points ?? 0,
      assignmentGroup: assignment.assignmentGroup ?? "ASSIGNMENTS",
      displayGradeAs: assignment.displayGradeAs ?? "Percentage",
      submissionType: assignment.submissionType ?? "Online",
      assignTo: assignment.assignTo ?? "Everyone",
      availableFrom: assignment.availableFrom ?? "",
      dueDate: assignment.dueDate ?? "",
      availableUntil: assignment.availableUntil ?? "",
    };
    db.assignments = [...db.assignments, newAssignment];
    return newAssignment;
  }

  function updateAssignment(assignmentId, updates) {
    const assignment = db.assignments.find((item) => item._id === assignmentId);
    if (!assignment) {
      return null;
    }
    Object.assign(assignment, updates);
    return assignment;
  }

  function deleteAssignment(assignmentId) {
    db.assignments = db.assignments.filter(
      (assignment) => assignment._id !== assignmentId,
    );
    return { deleted: true };
  }

  return {
    createAssignment,
    deleteAssignment,
    findAssignmentById,
    findAssignmentsForCourse,
    updateAssignment,
  };
}
