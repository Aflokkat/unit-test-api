const express = require("express");
// mergeParams: true -> permet de lire :userId défini par le router parent (user.route)
const router = express.Router({ mergeParams: true });
const postController = require("../../controllers/post.controller");

// Sous-ressource posts, montée sous /users/:userId/posts par user.route.js
// -> URL finale /api/v1/users/:userId/posts
router.get("/", postController.getByUser);
router.post("/", postController.create);

module.exports = router;
