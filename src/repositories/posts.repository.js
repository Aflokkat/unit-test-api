const fs = require("fs/promises");

const DB_PATH = "./src/database/posts.json";

// Lit tous les posts depuis le fichier JSON
async function getPosts() {
  const data = await fs.readFile(DB_PATH);
  return JSON.parse(data);
}

// Écrit la liste complète des posts (helper interne)
async function savePosts(posts) {
  await fs.writeFile(DB_PATH, JSON.stringify(posts, null, 2));
}

// Renvoie les posts appartenant à un user
async function getPostsByUserId(userId) {
  const posts = await getPosts();
  return posts.filter((post) => post.userId === userId);
}

// Ajoute un post et renvoie le post créé
async function createPost(post) {
  const posts = await getPosts();
  posts.push(post);
  await savePosts(posts);
  return post;
}

module.exports = {
  getPosts,
  getPostsByUserId,
  createPost,
};
