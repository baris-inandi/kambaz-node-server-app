import UsersDao from "./dao.js";

export default function UserRoutes(app, db) {
  const dao = UsersDao(db);

  app.post("/api/users/signup", (req, res) => {
    const existingUser = dao.findUserByUsername(req.body.username);
    if (existingUser) {
      res.status(400).json({ message: "Username already taken" });
      return;
    }

    const currentUser = dao.createUser(req.body);
    req.session.currentUser = currentUser;
    res.json(currentUser);
  });

  app.post("/api/users/signin", (req, res) => {
    const { username, password } = req.body;
    const currentUser = dao.findUserByCredentials(username, password);

    if (!currentUser) {
      res.status(401).json({ message: "Unable to login. Try again later." });
      return;
    }

    req.session.currentUser = currentUser;
    res.json(currentUser);
  });

  app.post("/api/users/profile", (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    res.json(currentUser);
  });

  app.post("/api/users/signout", (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.put("/api/users/:userId", (req, res) => {
    const updatedUser = dao.updateUser(req.params.userId, req.body);
    if (!updatedUser) {
      res.sendStatus(404);
      return;
    }

    if (req.session.currentUser?._id === updatedUser._id) {
      req.session.currentUser = updatedUser;
    }
    res.json(updatedUser);
  });
}
