import UsersDao from "./dao.js";
import {
  isAdmin,
  requireAdminUser,
  requireSelfOrAdmin,
  requireSignedInUser,
} from "../auth.js";

export default function UserRoutes(app) {
  const dao = UsersDao();
  const sessionCookieName = "kambaz.sid";
  const sessionCookieOptions =
    process.env.SERVER_ENV === "development"
      ? {}
      : {
          sameSite: "none",
          secure: true,
        };

  const destroySession = (req, res, status = 200) => {
    req.session.destroy((error) => {
      if (error) {
        res.sendStatus(500);
        return;
      }
      res.clearCookie(sessionCookieName, sessionCookieOptions);
      res.sendStatus(status);
    });
  };

  app.get("/api/users", async (req, res) => {
    const currentUser = requireAdminUser(req, res);
    if (!currentUser) {
      return;
    }

    const { role, name } = req.query;
    const users = await dao.findAllUsers(role, name);
    res.json(users);
  });

  app.get("/api/users/:userId", async (req, res) => {
    const currentUser = requireSelfOrAdmin(req, res, req.params.userId);
    if (!currentUser) {
      return;
    }

    const user = await dao.findUserById(req.params.userId);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    const currentUser = requireAdminUser(req, res);
    if (!currentUser) {
      return;
    }

    const user = await dao.createUser(req.body);
    res.json(user);
  });

  app.post("/api/users/signup", async (req, res) => {
    const existingUser = await dao.findUserByUsername(req.body.username);
    if (existingUser) {
      res.status(400).json({ message: "Username already taken" });
      return;
    }

    const currentUser = await dao.createUser(req.body);
    req.session.currentUser = currentUser;
    res.json(currentUser);
  });

  app.post("/api/users/signin", async (req, res) => {
    const { username, password } = req.body;
    const currentUser = await dao.findUserByCredentials(username, password);

    if (!currentUser) {
      res
        .status(401)
        .json({ message: "Unable to sign in. Check credentials." });
      return;
    }

    req.session.currentUser = currentUser;
    res.json(currentUser);
  });

  app.post("/api/users/profile", async (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    const refreshedUser = await dao.findUserById(currentUser._id);
    if (!refreshedUser) {
      destroySession(req, res, 401);
      return;
    }
    req.session.currentUser = refreshedUser;
    res.json(refreshedUser);
  });

  app.post("/api/users/signout", (req, res) => {
    destroySession(req, res);
  });

  app.put("/api/users/:userId", async (req, res) => {
    const currentUser = requireSelfOrAdmin(req, res, req.params.userId);
    if (!currentUser) {
      return;
    }

    const updatedUser = await dao.updateUser(req.params.userId, req.body);
    if (!updatedUser) {
      res.sendStatus(404);
      return;
    }

    if (req.session.currentUser?._id === updatedUser._id) {
      req.session.currentUser = updatedUser;
    }
    res.json(updatedUser);
  });

  app.delete("/api/users/:userId", async (req, res) => {
    const currentUser = requireAdminUser(req, res);
    if (!currentUser) {
      return;
    }

    const deletedUser = await dao.deleteUser(req.params.userId);
    if (!deletedUser) {
      res.sendStatus(404);
      return;
    }
    if (req.session.currentUser?._id === req.params.userId) {
      destroySession(req, res);
      return;
    }
    res.json(deletedUser);
  });
}
