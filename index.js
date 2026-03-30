import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import Hello from "./Hello.js";
import Lab5 from "./Lab5/index.js";
import AssignmentsRoutes from "./kambaz/assignments/routes.js";
import CourseRoutes from "./kambaz/courses/routes.js";
import db from "./kambaz/database/index.js";
import EnrollmentsRoutes from "./kambaz/enrollments/routes.js";
import ModulesRoutes from "./kambaz/modules/routes.js";
import UserRoutes from "./kambaz/users/routes.js";

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  }),
);

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz",
  resave: false,
  saveUninitialized: false,
};

if (process.env.SERVER_ENV !== "development") {
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    sameSite: "none",
    secure: true,
    domain: process.env.SERVER_URL,
  };
}

app.use(session(sessionOptions));
app.use(express.json());

UserRoutes(app, db);
CourseRoutes(app, db);
EnrollmentsRoutes(app, db);
ModulesRoutes(app, db);
AssignmentsRoutes(app, db);
Lab5(app);
Hello(app);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Kambaz server listening on port ${port}`);
});
