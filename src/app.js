const express = require("express");
const app = express();
const port = 3000;
const apiRouter = require("./routes");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// L'app ne connaît que /api ; le versioning (/v1) et les ressources (/users)
// sont gérés dans le dossier routes/
app.use("/api", apiRouter);

// Ne démarre le serveur que si le fichier est exécuté directement (pas en test)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports = app;
