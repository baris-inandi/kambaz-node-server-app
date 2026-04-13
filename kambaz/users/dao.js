import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function UsersDao() {
  const findAllUsers = (role, name) => {
    if (role) {
      return model.find({ role });
    }
    if (name) {
      return model.find({
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ],
      });
    }
    return model.find();
  };

  const findUserById = (userId) => model.findById(userId);

  const findUserByUsername = (username) => model.findOne({ username });

  const findUserByCredentials = (username, password) =>
    model.findOne({ username, password });

  const createUser = (user) =>
    model.create({
      _id: user._id ?? uuidv4(),
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
    });

  const updateUser = async (userId, updates) => {
    await model.updateOne({ _id: userId }, { $set: updates });
    return model.findById(userId);
  };

  const deleteUser = (userId) => model.findByIdAndDelete(userId);

  return {
    createUser,
    deleteUser,
    findAllUsers,
    findUserByCredentials,
    findUserById,
    findUserByUsername,
    updateUser,
  };
}
