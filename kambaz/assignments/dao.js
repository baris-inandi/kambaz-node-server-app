import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function AssignmentsDao() {
  const normalizeAssignmentId = (assignmentId) => {
    if (typeof assignmentId !== "string") {
      return uuidv4();
    }
    const trimmedId = assignmentId.trim();
    if (!trimmedId || trimmedId === "new") {
      return uuidv4();
    }
    return trimmedId;
  };

  const findAssignmentsForCourse = (courseId) =>
    model.find({ course: courseId });

  const findAssignmentById = (assignmentId) => model.findById(assignmentId);

  const createAssignment = (assignment) =>
    model.create({
      _id: normalizeAssignmentId(assignment._id),
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
    });

  const updateAssignment = async (assignmentId, updates) => {
    await model.updateOne({ _id: assignmentId }, { $set: updates });
    return model.findById(assignmentId);
  };

  const deleteAssignment = (assignmentId) =>
    model.deleteOne({ _id: assignmentId });

  return {
    createAssignment,
    deleteAssignment,
    findAssignmentById,
    findAssignmentsForCourse,
    updateAssignment,
  };
}
