const postsRepository = require("../repositories/posts.repository");
const usersRepository = require("../repositories/users.repository");
const crypto = require("crypto");

const MAX_CONTENT_LENGTH = 280;

// Vérification légère appliquée à chaque post avant création.
// Lève une erreur (-> 400 côté controller) si le contenu est invalide.
function validatePost(data) {
  const content = data?.content;

  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new Error("Content required");
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content too long (max ${MAX_CONTENT_LENGTH})`);
  }
}

// Liste les posts d'un user. Renvoie null si l'user n'existe pas (-> 404).
async function getPostsByUser(userId) {
  const user = await usersRepository.getUserById(userId);
  if (!user) {
    return null;
  }
  return await postsRepository.getPostsByUserId(userId);
}

// Crée un post rattaché à un user.
// Renvoie null si l'user n'existe pas (-> 404) ; lève si le post est invalide (-> 400).
async function createPost(userId, data) {
  const user = await usersRepository.getUserById(userId);
  if (!user) {
    return null;
  }

  validatePost(data);

  const post = {
    id: crypto.randomUUID(),
    userId,
    content: data.content.trim(),
    createdAt: new Date().toISOString(),
  };

  return await postsRepository.createPost(post);
}

module.exports = {
  validatePost,
  getPostsByUser,
  createPost,
};
