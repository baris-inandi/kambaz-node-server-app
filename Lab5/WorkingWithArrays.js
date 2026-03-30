let todos = [
  { id: 1, title: "Task 1", description: "Todo 1", completed: false },
  { id: 2, title: "Task 2", description: "Todo 2", completed: true },
  { id: 3, title: "Task 3", description: "Todo 3", completed: false },
  { id: 4, title: "Task 4", description: "Todo 4", completed: true },
];

export default function WorkingWithArrays(app) {
  const findTodoIndex = (id) =>
    todos.findIndex((todo) => todo.id === parseInt(id, 10));

  app.get("/lab5/todos", (req, res) => {
    const { completed } = req.query;
    if (completed !== undefined) {
      const completedTodos = todos.filter(
        (todo) => todo.completed === (completed === "true"),
      );
      res.json(completedTodos);
      return;
    }
    res.json(todos);
  });

  app.get("/lab5/todos/create", (req, res) => {
    const newTodo = {
      id: Date.now(),
      title: "New Task",
      description: "New todo description",
      completed: false,
    };
    todos.push(newTodo);
    res.json(todos);
  });

  app.post("/lab5/todos", (req, res) => {
    const newTodo = {
      id: Date.now(),
      title: req.body.title ?? "New Posted Todo",
      description: req.body.description ?? "",
      completed: req.body.completed ?? false,
    };
    todos.push(newTodo);
    res.json(newTodo);
  });

  app.get("/lab5/todos/:id/delete", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to delete Todo with ID ${req.params.id}` });
      return;
    }
    todos.splice(todoIndex, 1);
    res.json(todos);
  });

  app.delete("/lab5/todos/:id", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to delete Todo with ID ${req.params.id}` });
      return;
    }
    todos.splice(todoIndex, 1);
    res.sendStatus(200);
  });

  app.put("/lab5/todos/:id", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to update Todo with ID ${req.params.id}` });
      return;
    }
    todos[todoIndex] = { ...todos[todoIndex], ...req.body };
    res.sendStatus(200);
  });

  app.get("/lab5/todos/:id/title/:title", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to update Todo with ID ${req.params.id}` });
      return;
    }
    todos[todoIndex].title = req.params.title;
    res.json(todos);
  });

  app.get("/lab5/todos/:id/description/:description", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to update Todo with ID ${req.params.id}` });
      return;
    }
    todos[todoIndex].description = req.params.description;
    res.json(todos);
  });

  app.get("/lab5/todos/:id/completed/:completed", (req, res) => {
    const todoIndex = findTodoIndex(req.params.id);
    if (todoIndex === -1) {
      res
        .status(404)
        .json({ message: `Unable to update Todo with ID ${req.params.id}` });
      return;
    }
    todos[todoIndex].completed = req.params.completed === "true";
    res.json(todos);
  });

  app.get("/lab5/todos/:id", (req, res) => {
    const todo = todos.find((item) => item.id === parseInt(req.params.id, 10));
    if (!todo) {
      res
        .status(404)
        .json({ message: `Unable to find Todo with ID ${req.params.id}` });
      return;
    }
    res.json(todo);
  });
}
