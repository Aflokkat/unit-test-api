const fs = require("fs/promises");

async function getUsers() {
  const data = await fs.readFile("./src/database/db.json");
  return JSON.parse(data);
}

async function createUser(user) {
  const users = await getUsers();
  users.push(user);
  await fs.writeFile("./src/database/db.json", JSON.stringify(users, null, 2));
}

module.exports = {
  getUsers,
  createUser,
};
