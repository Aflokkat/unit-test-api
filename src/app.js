const express = require("express");
const app = express();
const port = 3000;
const userController = require("./controllers/user.controller");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/users", userController.create);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
