import { v4 as uuidv4 } from "uuid";

export default function UsersDao(db) {
  const sanitizeUser = (user) => {
    if (!user) {
      return user;
    }
    return { ...user };
  };

  function findUserById(userId) {
    return sanitizeUser(db.users.find((user) => user._id === userId));
  }

  function findUserByUsername(username) {
    return sanitizeUser(db.users.find((user) => user.username === username));
  }

  function findUserByCredentials(username, password) {
    return sanitizeUser(
      db.users.find(
        (user) => user.username === username && user.password === password,
      ),
    );
  }

  function createUser(user) {
    const newUser = {
      _id: uuidv4(),
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      loginId: user.loginId ?? "",
      username: user.username ?? "",
      password: user.password ?? "",
      email: user.email ?? "",
      dob: user.dob ?? "",
      section: user.section ?? "",
      role: user.role ?? "STUDENT",
      lastActivity: user.lastActivity ?? "",
      totalActivity: user.totalActivity ?? "",
    };
    db.users = [...db.users, newUser];
    return sanitizeUser(newUser);
  }

  function updateUser(userId, updates) {
    const user = db.users.find((item) => item._id === userId);
    if (!user) {
      return null;
    }
    Object.assign(user, updates);
    return sanitizeUser(user);
  }

  return {
    createUser,
    findUserByCredentials,
    findUserById,
    findUserByUsername,
    updateUser,
  };
}
