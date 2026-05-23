const usersRepository = require("../repositories/users.repository");
const { v4: uuidv4 } = require("uuid");

async function createUser(name) {
  if (!name) {
    throw new Error("Name required");
  }

  return await usersRepository.createUser({ name, id: uuidv4() });
}

module.exports = {
  createUser,
};
