const usersRepository = require("../repositories/users.repository");
const crypto = require("crypto");

// Liste tous les users
async function getUsers() {
  return await usersRepository.getUsers();
}

// Récupère un user par id (null si absent, le controller en fera un 404)
async function getUserById(id) {
  return await usersRepository.getUserById(id);
}

// Crée un user : valide le name puis génère un id
async function createUser(name) {
  if (!name) {
    throw new Error("Name required");
  }

  return await usersRepository.createUser({ name, id: crypto.randomUUID() });
}

// Met à jour le name d'un user (null si l'user n'existe pas)
async function updateUser(id, name) {
  if (!name) {
    throw new Error("Name required");
  }

  return await usersRepository.updateUser(id, { name });
}

// Supprime un user (false si l'user n'existe pas)
async function deleteUser(id) {
  return await usersRepository.deleteUser(id);
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
