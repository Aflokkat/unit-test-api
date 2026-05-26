const postsService = require("../services/posts.service");

// GET /api/v1/users/:userId/posts -> liste les posts d'un user (404 si user absent)
async function getByUser(req, res) {
  try {
    const posts = await postsService.getPostsByUser(req.params.userId);
    if (!posts) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/v1/users/:userId/posts -> crée un post (404 si user absent, 400 si invalide)
async function create(req, res) {
  try {
    const post = await postsService.createPost(req.params.userId, req.body || {});
    if (!post) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getByUser,
  create,
};
