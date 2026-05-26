const express = require("express");
const router = express.Router();
const userRouter = require("./user.route");

// Ressources de l'API v1. Préfixe /v1 ajouté par routes/index.js.
router.use("/users", userRouter);

module.exports = router;
