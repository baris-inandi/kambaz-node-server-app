export default function QueryParameters(app) {
  app.get("/lab5/calculator", (req, res) => {
    const { a, b, operation } = req.query;
    const first = parseInt(a, 10);
    const second = parseInt(b, 10);

    let result = 0;
    switch (operation) {
      case "add":
        result = first + second;
        break;
      case "subtract":
        result = first - second;
        break;
      case "multiply":
        result = first * second;
        break;
      case "divide":
        if (second === 0) {
          res.status(400).json({ message: "Cannot divide by zero" });
          return;
        }
        result = first / second;
        break;
      default:
        result = "Invalid operation";
    }

    res.send(result.toString());
  });
}
