export default function PathParameters(app) {
  const parseNumbers = (req) => {
    const { a, b } = req.params;
    return { a: parseInt(a, 10), b: parseInt(b, 10) };
  };

  app.get("/lab5/add/:a/:b", (req, res) => {
    const { a, b } = parseNumbers(req);
    res.send((a + b).toString());
  });

  app.get("/lab5/subtract/:a/:b", (req, res) => {
    const { a, b } = parseNumbers(req);
    res.send((a - b).toString());
  });

  app.get("/lab5/multiply/:a/:b", (req, res) => {
    const { a, b } = parseNumbers(req);
    res.send((a * b).toString());
  });

  app.get("/lab5/divide/:a/:b", (req, res) => {
    const { a, b } = parseNumbers(req);
    if (b === 0) {
      res.status(400).json({ message: "Cannot divide by zero" });
      return;
    }
    res.send((a / b).toString());
  });
}
