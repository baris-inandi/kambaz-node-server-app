let assignment = {
  id: 1,
  title: "NodeJS Assignment",
  description: "Create a NodeJS server with ExpressJS",
  due: "2021-10-10",
  completed: false,
  score: 0,
};

export default function WorkingWithObjects(app) {
  app.get("/lab5/assignment", (req, res) => {
    res.json(assignment);
  });

  app.get("/lab5/assignment/title", (req, res) => {
    res.json(assignment.title);
  });

  app.put("/lab5/assignment/title", (req, res) => {
    assignment = { ...assignment, title: req.body.title ?? assignment.title };
    res.json(assignment);
  });

  app.put("/lab5/assignment/score", (req, res) => {
    assignment = { ...assignment, score: req.body.score ?? assignment.score };
    res.json(assignment);
  });

  app.put("/lab5/assignment/completed", (req, res) => {
    assignment = {
      ...assignment,
      completed: req.body.completed ?? assignment.completed,
    };
    res.json(assignment);
  });
}
