import { v4 as uuidv4 } from "uuid";
import CourseModel from "../courses/model.js";
import model from "./model.js";
import { cloneDefaultPazzaFolders } from "./defaultFolders.js";

const isInstructorRole = (role) => role === "FACULTY" || role === "TA";

const canViewPost = (post, currentUser) => {
  if (post.audience === "CLASS") {
    return true;
  }

  if (post.author === currentUser._id) {
    return true;
  }

  if (post.visibleToUsers?.includes(currentUser._id)) {
    return true;
  }

  return isInstructorRole(currentUser.role) && post.includeInstructors;
};

const normalizeFolderIds = (folderIds) =>
  Array.from(new Set((folderIds ?? []).filter(Boolean)));

const normalizeVisibleUsers = (visibleToUsers) =>
  Array.from(new Set((visibleToUsers ?? []).filter(Boolean)));

const createTimestamp = () => new Date();

const createAnswer = (author, bodyHtml) => ({
  _id: uuidv4(),
  author,
  bodyHtml,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

const createReply = (author, text) => ({
  _id: uuidv4(),
  author,
  text,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
  replies: [],
});

const createFollowup = (author, text) => ({
  _id: uuidv4(),
  author,
  text,
  resolved: false,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
  replies: [],
});

const findNodeById = (nodes, nodeId) => {
  for (const node of nodes ?? []) {
    if (node._id === nodeId) {
      return node;
    }
    const match = findNodeById(node.replies, nodeId);
    if (match) {
      return match;
    }
  }
  return null;
};

const deleteNodeById = (nodes, nodeId) => {
  const index = (nodes ?? []).findIndex((node) => node._id === nodeId);
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }

  return (nodes ?? []).some((node) => deleteNodeById(node.replies, nodeId));
};

export default function PazzaDao() {
  const ensureFoldersForCourse = async (courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return null;
    }

    if (!course.pazzaFolders?.length) {
      course.pazzaFolders = cloneDefaultPazzaFolders();
      await course.save();
    }

    return course;
  };

  const findFoldersForCourse = async (courseId) => {
    const course = await ensureFoldersForCourse(courseId);
    return course?.pazzaFolders ?? null;
  };

  const createFolder = async (courseId, name) => {
    const course = await ensureFoldersForCourse(courseId);
    if (!course) {
      return null;
    }

    const folder = { _id: uuidv4(), name: name.trim() };
    course.pazzaFolders.push(folder);
    await course.save();
    return folder;
  };

  const updateFolder = async (courseId, folderId, updates) => {
    const course = await ensureFoldersForCourse(courseId);
    const folder = course?.pazzaFolders?.id(folderId);
    if (!folder) {
      return null;
    }

    folder.name = updates.name?.trim() ?? folder.name;
    await course.save();
    return folder;
  };

  const deleteFolders = async (courseId, folderIds) => {
    const course = await ensureFoldersForCourse(courseId);
    if (!course) {
      return null;
    }

    const selectedIds = new Set(folderIds);
    const remainingFolders = course.pazzaFolders.filter(
      (folder) => !selectedIds.has(folder._id),
    );

    if (!remainingFolders.length) {
      return { error: "AT_LEAST_ONE_FOLDER_REQUIRED" };
    }

    course.pazzaFolders = remainingFolders;
    await course.save();

    const remainingFolderIds = new Set(
      remainingFolders.map((folder) => folder._id),
    );
    const fallbackFolderId = remainingFolders[0]._id;
    const posts = await model.find({ course: courseId });

    for (const post of posts) {
      const nextFolderIds = post.folderIds.filter((id) =>
        remainingFolderIds.has(id),
      );
      post.folderIds = nextFolderIds.length
        ? nextFolderIds
        : [fallbackFolderId];
      await post.save();
    }

    return { deleted: folderIds.length };
  };

  const findVisiblePostsForCourse = async (
    courseId,
    currentUser,
    filters = {},
  ) => {
    const posts = await model
      .find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();
    return posts.filter((post) => {
      if (!canViewPost(post, currentUser)) {
        return false;
      }

      if (filters.folder && !post.folderIds.includes(filters.folder)) {
        return false;
      }

      if (filters.search) {
        const haystack = `${post.summary} ${post.detailsHtml}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  const findVisiblePostById = async (
    courseId,
    postId,
    currentUser,
    options = {},
  ) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post || !canViewPost(post, currentUser)) {
      return null;
    }

    if (
      options.markViewed !== false &&
      !post.viewedBy.includes(currentUser._id)
    ) {
      post.viewedBy.push(currentUser._id);
      await post.save();
    }

    return post;
  };

  const createPost = async (courseId, currentUser, post) =>
    model.create({
      _id: uuidv4(),
      course: courseId,
      type: post.type ?? "QUESTION",
      summary: post.summary?.trim() ?? "",
      detailsHtml: post.detailsHtml ?? "",
      folderIds: normalizeFolderIds(post.folderIds),
      author: currentUser._id,
      audience: post.audience ?? "CLASS",
      visibleToUsers: normalizeVisibleUsers(post.visibleToUsers),
      includeInstructors: Boolean(post.includeInstructors),
      viewedBy: [currentUser._id],
      studentAnswers: [],
      instructorAnswers: [],
      followups: [],
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    });

  const updatePost = async (courseId, postId, updates) => {
    await model.updateOne(
      { _id: postId, course: courseId },
      {
        $set: {
          type: updates.type,
          summary: updates.summary?.trim(),
          detailsHtml: updates.detailsHtml,
          folderIds: normalizeFolderIds(updates.folderIds),
          audience: updates.audience,
          visibleToUsers: normalizeVisibleUsers(updates.visibleToUsers),
          includeInstructors: Boolean(updates.includeInstructors),
          updatedAt: createTimestamp(),
        },
      },
    );
    return model.findOne({ _id: postId, course: courseId });
  };

  const deletePost = (courseId, postId) =>
    model.deleteOne({ _id: postId, course: courseId });

  const createAnswerForPost = async (
    courseId,
    postId,
    currentUser,
    bodyHtml,
  ) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const key = isInstructorRole(currentUser.role)
      ? "instructorAnswers"
      : "studentAnswers";
    post[key].push(createAnswer(currentUser._id, bodyHtml));
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const updateAnswerForPost = async (courseId, postId, answerId, bodyHtml) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const answer =
      post.studentAnswers.id(answerId) ?? post.instructorAnswers.id(answerId);
    if (!answer) {
      return null;
    }

    answer.bodyHtml = bodyHtml;
    answer.updatedAt = createTimestamp();
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const deleteAnswerForPost = async (courseId, postId, answerId) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const studentAnswer = post.studentAnswers.id(answerId);
    if (studentAnswer) {
      studentAnswer.deleteOne();
    }

    const instructorAnswer = post.instructorAnswers.id(answerId);
    if (instructorAnswer) {
      instructorAnswer.deleteOne();
    }

    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const createFollowupForPost = async (courseId, postId, currentUser, text) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    post.followups.push(createFollowup(currentUser._id, text));
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const updateFollowupForPost = async (
    courseId,
    postId,
    followupId,
    updates,
  ) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const followup = post.followups.id(followupId);
    if (!followup) {
      return null;
    }

    if (typeof updates.text === "string") {
      followup.text = updates.text;
    }
    if (typeof updates.resolved === "boolean") {
      followup.resolved = updates.resolved;
    }
    followup.updatedAt = createTimestamp();
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const deleteFollowupForPost = async (courseId, postId, followupId) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const followup = post.followups.id(followupId);
    if (!followup) {
      return null;
    }

    followup.deleteOne();
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const createReplyForPost = async (
    courseId,
    postId,
    parentId,
    currentUser,
    text,
  ) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const parent = findNodeById(post.followups, parentId);
    if (!parent) {
      return null;
    }

    parent.replies.push(createReply(currentUser._id, text));
    parent.updatedAt = createTimestamp();
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const updateReplyForPost = async (courseId, postId, replyId, updates) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const reply = findNodeById(post.followups, replyId);
    if (!reply) {
      return null;
    }

    if (typeof updates.text === "string") {
      reply.text = updates.text;
    }
    reply.updatedAt = createTimestamp();
    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const deleteReplyForPost = async (courseId, postId, replyId) => {
    const post = await model.findOne({ _id: postId, course: courseId });
    if (!post) {
      return null;
    }

    const deleted = deleteNodeById(post.followups, replyId);
    if (!deleted) {
      return null;
    }

    post.updatedAt = createTimestamp();
    await post.save();
    return post;
  };

  const findStatsForCourse = async (
    courseId,
    currentUser,
    enrolledUsers = [],
  ) => {
    const posts = await findVisiblePostsForCourse(courseId, currentUser);
    const questionPosts = posts.filter((post) => post.type === "QUESTION");

    return {
      unreadCount: posts.filter(
        (post) => !post.viewedBy.includes(currentUser._id),
      ).length,
      unansweredCount: questionPosts.filter(
        (post) =>
          (post.studentAnswers?.length ?? 0) +
            (post.instructorAnswers?.length ?? 0) ===
          0,
      ).length,
      totalPosts: posts.length,
      instructorResponses: questionPosts.reduce(
        (count, post) => count + (post.instructorAnswers?.length ?? 0),
        0,
      ),
      studentResponses: questionPosts.reduce(
        (count, post) => count + (post.studentAnswers?.length ?? 0),
        0,
      ),
      studentsEnrolled: enrolledUsers.filter((user) => user.role === "STUDENT")
        .length,
    };
  };

  return {
    createAnswerForPost,
    createFolder,
    createFollowupForPost,
    createPost,
    createReplyForPost,
    deleteAnswerForPost,
    deleteFolders,
    deleteFollowupForPost,
    deletePost,
    deleteReplyForPost,
    ensureFoldersForCourse,
    findFoldersForCourse,
    findStatsForCourse,
    findVisiblePostById,
    findVisiblePostsForCourse,
    updateAnswerForPost,
    updateFolder,
    updateFollowupForPost,
    updatePost,
    updateReplyForPost,
  };
}
