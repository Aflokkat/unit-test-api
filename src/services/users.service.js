const usersRepository = require("../repositories/users.repository");
const crypto = require("crypto");

async function createUser(name) {
  if (!name) {
    throw new Error("Name required");
  }

  return await usersRepository.createUser({ name, id: crypto.randomUUID() });
}

module.exports = {
  createUser,
};
