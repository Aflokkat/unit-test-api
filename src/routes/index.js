const express = require("express");
const router = express.Router();
const v1Router = require("./v1");

// Router racine de l'API. Préfixe /api ajouté dans app.js.
// Le versioning vit ici : ajouter /v2 le moment venu sans toucher à app.js.
router.use("/v1", v1Router);

module.exports = router;
