import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import Hello from "./Hello.js";
import Lab5 from "./Lab5/index.js";
import AssignmentsRoutes from "./kambaz/assignments/routes.js";
import CourseRoutes from "./kambaz/courses/routes.js";
import EnrollmentsRoutes from "./kambaz/enrollments/routes.js";
import ModulesRoutes from "./kambaz/modules/routes.js";
import UserRoutes from "./kambaz/users/routes.js";

const app = express();
const CONNECTION_STRING =
  process.env.DATABASE_CONNECTION_STRING || "mongodb://127.0.0.1:27017/kambaz";

mongoose.connect(CONNECTION_STRING);

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

UserRoutes(app);
CourseRoutes(app);
EnrollmentsRoutes(app);
ModulesRoutes(app);
AssignmentsRoutes(app);
Lab5(app);
Hello(app);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Kambaz server listening on port ${port}`);
});
