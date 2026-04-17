import EnrollmentsDao from "../enrollments/dao.js";
import PazzaDao from "./dao.js";

const isInstructor = (user) => user?.role === "FACULTY" || user?.role === "TA";

const hasRequiredPostFields = (post) =>
  Boolean(post.summary?.trim()) &&
  post.summary.trim().length <= 100 &&
  Boolean(post.detailsHtml?.trim()) &&
  Array.isArray(post.folderIds) &&
  post.folderIds.length > 0;

export default function PazzaRoutes(app) {
  const pazzaDao = PazzaDao();
  const enrollmentsDao = EnrollmentsDao();

  const requireCourseUser = async (req, res) => {
    const currentUser = req.session.currentUser;
    if (!currentUser) {
      res.sendStatus(401);
      return null;
    }

    const isEnrolled = await enrollmentsDao.isUserEnrolledInCourse(
      currentUser._id,
      req.params.cid,
    );
    if (!isEnrolled) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  };

  const requireInstructor = async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return null;
    }

    if (!isInstructor(currentUser)) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  };

  app.get("/api/courses/:cid/pazza/folders", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const folders = await pazzaDao.findFoldersForCourse(req.params.cid);
    if (!folders) {
      res.sendStatus(404);
      return;
    }
    res.json(folders);
  });

  app.post("/api/courses/:cid/pazza/folders", async (req, res) => {
    const currentUser = await requireInstructor(req, res);
    if (!currentUser) {
      return;
    }

    if (!req.body.name?.trim()) {
      res.status(400).json({ message: "Folder name is required." });
      return;
    }

    const folder = await pazzaDao.createFolder(req.params.cid, req.body.name);
    if (!folder) {
      res.sendStatus(404);
      return;
    }
    res.json(folder);
  });

  app.put("/api/courses/:cid/pazza/folders/:folderId", async (req, res) => {
    const currentUser = await requireInstructor(req, res);
    if (!currentUser) {
      return;
    }

    if (!req.body.name?.trim()) {
      res.status(400).json({ message: "Folder name is required." });
      return;
    }

    const folder = await pazzaDao.updateFolder(
      req.params.cid,
      req.params.folderId,
      req.body,
    );
    if (!folder) {
      res.sendStatus(404);
      return;
    }
    res.json(folder);
  });

  app.delete("/api/courses/:cid/pazza/folders", async (req, res) => {
    const currentUser = await requireInstructor(req, res);
    if (!currentUser) {
      return;
    }

    const folderIds = req.body.folderIds ?? [];
    const status = await pazzaDao.deleteFolders(req.params.cid, folderIds);
    if (!status) {
      res.sendStatus(404);
      return;
    }
    if (status.error) {
      res.status(400).json({ message: "At least one folder must remain." });
      return;
    }
    res.json(status);
  });

  app.get("/api/courses/:cid/pazza/posts", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const posts = await pazzaDao.findVisiblePostsForCourse(
      req.params.cid,
      currentUser,
      {
        folder: req.query.folder,
        search: req.query.search,
      },
    );
    res.json(posts);
  });

  app.get("/api/courses/:cid/pazza/posts/:postId", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const post = await pazzaDao.findVisiblePostById(
      req.params.cid,
      req.params.postId,
      currentUser,
    );
    if (!post) {
      res.sendStatus(404);
      return;
    }
    res.json(post);
  });

  app.post("/api/courses/:cid/pazza/posts", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    if (!hasRequiredPostFields(req.body)) {
      res.status(400).json({ message: "Missing required post fields." });
      return;
    }

    if (
      req.body.audience === "INDIVIDUALS" &&
      !req.body.includeInstructors &&
      !(req.body.visibleToUsers ?? []).length
    ) {
      res.status(400).json({ message: "Choose at least one recipient." });
      return;
    }

    const post = await pazzaDao.createPost(
      req.params.cid,
      currentUser,
      req.body,
    );
    res.json(post);
  });

  app.put("/api/courses/:cid/pazza/posts/:postId", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const existingPost = await pazzaDao.findVisiblePostById(
      req.params.cid,
      req.params.postId,
      currentUser,
      { markViewed: false },
    );
    if (!existingPost) {
      res.sendStatus(404);
      return;
    }

    if (
      !(isInstructor(currentUser) || existingPost.author === currentUser._id)
    ) {
      res.sendStatus(403);
      return;
    }

    if (!hasRequiredPostFields(req.body)) {
      res.status(400).json({ message: "Missing required post fields." });
      return;
    }

    const updatedPost = await pazzaDao.updatePost(
      req.params.cid,
      req.params.postId,
      req.body,
    );
    res.json(updatedPost);
  });

  app.delete("/api/courses/:cid/pazza/posts/:postId", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const existingPost = await pazzaDao.findVisiblePostById(
      req.params.cid,
      req.params.postId,
      currentUser,
      { markViewed: false },
    );
    if (!existingPost) {
      res.sendStatus(404);
      return;
    }

    if (
      !(isInstructor(currentUser) || existingPost.author === currentUser._id)
    ) {
      res.sendStatus(403);
      return;
    }

    const status = await pazzaDao.deletePost(req.params.cid, req.params.postId);
    res.json(status);
  });

  app.post(
    "/api/courses/:cid/pazza/posts/:postId/answers",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      if (!req.body.bodyHtml?.trim()) {
        res.status(400).json({ message: "Answer details are required." });
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      if (!post || post.type !== "QUESTION") {
        res.sendStatus(404);
        return;
      }

      const answers = isInstructor(currentUser)
        ? post.instructorAnswers
        : post.studentAnswers;
      if (answers.length > 0) {
        res.status(400).json({
          message: isInstructor(currentUser)
            ? "An instructor answer already exists for this question."
            : "A student answer already exists for this question.",
        });
        return;
      }

      const updatedPost = await pazzaDao.createAnswerForPost(
        req.params.cid,
        req.params.postId,
        currentUser,
        req.body.bodyHtml,
      );
      res.json(updatedPost);
    },
  );

  app.put(
    "/api/courses/:cid/pazza/posts/:postId/answers/:answerId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      if (!post) {
        res.sendStatus(404);
        return;
      }

      const answer =
        post.studentAnswers.id(req.params.answerId) ??
        post.instructorAnswers.id(req.params.answerId);
      if (!answer) {
        res.sendStatus(404);
        return;
      }

      const canEdit =
        isInstructor(currentUser) ||
        (answer.author === currentUser._id &&
          !isInstructor(currentUser) &&
          post.studentAnswers.id(req.params.answerId));
      if (!canEdit) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.updateAnswerForPost(
        req.params.cid,
        req.params.postId,
        req.params.answerId,
        req.body.bodyHtml ?? "",
      );
      res.json(updatedPost);
    },
  );

  app.delete(
    "/api/courses/:cid/pazza/posts/:postId/answers/:answerId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      if (!post) {
        res.sendStatus(404);
        return;
      }

      const answer =
        post.studentAnswers.id(req.params.answerId) ??
        post.instructorAnswers.id(req.params.answerId);
      if (!answer) {
        res.sendStatus(404);
        return;
      }

      const canDelete =
        isInstructor(currentUser) ||
        (answer.author === currentUser._id &&
          !isInstructor(currentUser) &&
          post.studentAnswers.id(req.params.answerId));
      if (!canDelete) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.deleteAnswerForPost(
        req.params.cid,
        req.params.postId,
        req.params.answerId,
      );
      res.json(updatedPost);
    },
  );

  app.post(
    "/api/courses/:cid/pazza/posts/:postId/followups",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      if (!req.body.text?.trim()) {
        res.status(400).json({ message: "Discussion text is required." });
        return;
      }

      const updatedPost = await pazzaDao.createFollowupForPost(
        req.params.cid,
        req.params.postId,
        currentUser,
        req.body.text.trim(),
      );
      if (!updatedPost) {
        res.sendStatus(404);
        return;
      }
      res.json(updatedPost);
    },
  );

  app.put(
    "/api/courses/:cid/pazza/posts/:postId/followups/:followupId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      const followup = post?.followups.id(req.params.followupId);
      if (!followup) {
        res.sendStatus(404);
        return;
      }

      if (!(isInstructor(currentUser) || followup.author === currentUser._id)) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.updateFollowupForPost(
        req.params.cid,
        req.params.postId,
        req.params.followupId,
        req.body,
      );
      res.json(updatedPost);
    },
  );

  app.delete(
    "/api/courses/:cid/pazza/posts/:postId/followups/:followupId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      const followup = post?.followups.id(req.params.followupId);
      if (!followup) {
        res.sendStatus(404);
        return;
      }

      if (!(isInstructor(currentUser) || followup.author === currentUser._id)) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.deleteFollowupForPost(
        req.params.cid,
        req.params.postId,
        req.params.followupId,
      );
      res.json(updatedPost);
    },
  );

  app.post(
    "/api/courses/:cid/pazza/posts/:postId/followups/:followupId/replies",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      if (!req.body.text?.trim()) {
        res.status(400).json({ message: "Reply text is required." });
        return;
      }

      const updatedPost = await pazzaDao.createReplyForPost(
        req.params.cid,
        req.params.postId,
        req.params.followupId,
        currentUser,
        req.body.text.trim(),
      );
      if (!updatedPost) {
        res.sendStatus(404);
        return;
      }
      res.json(updatedPost);
    },
  );

  app.put(
    "/api/courses/:cid/pazza/posts/:postId/replies/:replyId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      if (!post) {
        res.sendStatus(404);
        return;
      }

      const stack = [...post.followups];
      let reply = null;
      while (stack.length) {
        const node = stack.pop();
        if (node._id === req.params.replyId) {
          reply = node;
          break;
        }
        stack.push(...(node.replies ?? []));
      }

      if (!reply) {
        res.sendStatus(404);
        return;
      }

      if (!(isInstructor(currentUser) || reply.author === currentUser._id)) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.updateReplyForPost(
        req.params.cid,
        req.params.postId,
        req.params.replyId,
        req.body,
      );
      res.json(updatedPost);
    },
  );

  app.delete(
    "/api/courses/:cid/pazza/posts/:postId/replies/:replyId",
    async (req, res) => {
      const currentUser = await requireCourseUser(req, res);
      if (!currentUser) {
        return;
      }

      const post = await pazzaDao.findVisiblePostById(
        req.params.cid,
        req.params.postId,
        currentUser,
        { markViewed: false },
      );
      if (!post) {
        res.sendStatus(404);
        return;
      }

      const stack = [...post.followups];
      let reply = null;
      while (stack.length) {
        const node = stack.pop();
        if (node._id === req.params.replyId) {
          reply = node;
          break;
        }
        stack.push(...(node.replies ?? []));
      }

      if (!reply) {
        res.sendStatus(404);
        return;
      }

      if (!(isInstructor(currentUser) || reply.author === currentUser._id)) {
        res.sendStatus(403);
        return;
      }

      const updatedPost = await pazzaDao.deleteReplyForPost(
        req.params.cid,
        req.params.postId,
        req.params.replyId,
      );
      res.json(updatedPost);
    },
  );

  app.get("/api/courses/:cid/pazza/stats", async (req, res) => {
    const currentUser = await requireCourseUser(req, res);
    if (!currentUser) {
      return;
    }

    const users = await enrollmentsDao.findUsersForCourse(req.params.cid);
    const stats = await pazzaDao.findStatsForCourse(
      req.params.cid,
      currentUser,
      users,
    );
    res.json(stats);
  });
}
