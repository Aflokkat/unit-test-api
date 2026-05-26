const usersService = require("../services/users.service");

// GET /api/v1/users -> liste tous les users
async function getAll(req, res) {
  try {
    const users = await usersService.getUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/v1/users/:id -> un user, ou 404
async function getById(req, res) {
  try {
    const user = await usersService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/v1/users -> crée un user (400 si name manquant)
async function create(req, res) {
  try {
    const user = await usersService.createUser(req.body?.name);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// PUT /api/v1/users/:id -> met à jour (400 si name manquant, 404 si introuvable)
async function update(req, res) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body?.name);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /api/v1/users/:id -> supprime (404 si introuvable, 204 si OK)
async function remove(req, res) {
  try {
    const deleted = await usersService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
