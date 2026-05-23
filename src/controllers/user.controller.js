const usersService = require("../services/users.service");

async function create(req, res) {
  try {
    const user = await usersService.createUser(req.body?.name);

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
}

module.exports = {
  create,
};
