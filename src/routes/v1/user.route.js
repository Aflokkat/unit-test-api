const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user.controller");
const postRouter = require("./post.route");

// Routes de la ressource user. Montées sous /users par routes/v1/index.js,
// elles-mêmes sous /api/v1 -> URL finale /api/v1/users
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

// Sous-ressource : posts d'un user -> /api/v1/users/:userId/posts
router.use("/:userId/posts", postRouter);

module.exports = router;
