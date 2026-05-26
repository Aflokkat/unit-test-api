const fs = require("fs/promises");

const DB_PATH = "./src/database/db.json";

// Lit l'intégralité des users depuis le fichier JSON
async function getUsers() {
  const data = await fs.readFile(DB_PATH);
  return JSON.parse(data);
}

// Écrit la liste complète des users dans le fichier (helper interne)
async function saveUsers(users) {
  await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
}

// Renvoie un user par son id, ou null s'il n'existe pas
async function getUserById(id) {
  const users = await getUsers();
  return users.find((user) => user.id === id) || null;
}

// Ajoute un user et renvoie le user créé
async function createUser(user) {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
  return user;
}

// Met à jour les champs d'un user existant, ou renvoie null s'il n'existe pas.
// L'id n'est jamais modifiable.
async function updateUser(id, data) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }
  users[index] = { ...users[index], ...data, id };
  await saveUsers(users);
  return users[index];
}

// Supprime un user. Renvoie true si supprimé, false s'il n'existait pas.
async function deleteUser(id) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return false;
  }
  users.splice(index, 1);
  await saveUsers(users);
  return true;
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
