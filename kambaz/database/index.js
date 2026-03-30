import assignmentsData from "./assignments.json" with { type: "json" };
import coursesData from "./courses.json" with { type: "json" };
import enrollmentsData from "./enrollments.json" with { type: "json" };
import modulesData from "./modules.json" with { type: "json" };
import usersData from "./users.json" with { type: "json" };

const db = {
  assignments: structuredClone(assignmentsData),
  courses: structuredClone(coursesData),
  enrollments: structuredClone(enrollmentsData),
  modules: structuredClone(modulesData),
  users: structuredClone(usersData),
};

export default db;
