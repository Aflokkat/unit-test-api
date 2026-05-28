const request = require("supertest");
const fs = require("fs/promises");
const app = require("./app");

const DB_PATH = "./src/database/db.json";
const POSTS_DB_PATH = "./src/database/posts.json";
const USERS_URL = "/api/v1/users";

// Tests d'INTÉGRATION (pas unitaires) : supertest interroge directement l'app
// Express par de vraies requêtes HTTP. Rien n'est mocké : on vérifie tout le CRUD
// de bout en bout (route -> controller -> service -> repo). supertest gère lui-même
// le démarrage/arrêt du serveur à chaque requête, pas besoin de app.listen().
describe("API users (intégration HTTP)", () => {
  let originalDb; // contenu réel de db.json, sauvegardé pour restauration
  let originalPosts; // contenu réel de posts.json, sauvegardé pour restauration

  // Helper : crée un user via l'API et renvoie l'objet créé (id + name)
  async function createUser(name) {
    const res = await request(app).post(USERS_URL).send({ name });
    return res.body;
  }

  beforeAll(async () => {
    // Sauvegarde des bases réelles pour les remettre à l'identique après coup
    originalDb = await fs.readFile(DB_PATH, "utf-8");
    originalPosts = await fs.readFile(POSTS_DB_PATH, "utf-8");
  });

  afterAll(async () => {
    // Restauration des bases dans leur état d'origine
    await fs.writeFile(DB_PATH, originalDb);
    await fs.writeFile(POSTS_DB_PATH, originalPosts);
  });

  describe("GET /", () => {
    it("renvoie 200 et 'Hello World!'", async () => {
      const res = await request(app).get("/");

      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World!");
    });
  });

  describe(`GET ${USERS_URL}`, () => {
    it("renvoie 200 et un tableau de users", async () => {
      const created = await createUser("Liste");
      const res = await request(app).get(USERS_URL);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // le user qu'on vient de créer doit figurer dans la liste
      expect(res.body.some((u) => u.id === created.id)).toBe(true);
    });
  });

  describe(`POST ${USERS_URL}`, () => {
    it("crée un user et renvoie 201", async () => {
      const res = await request(app).post(USERS_URL).send({ name: "Charlie" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Charlie");
      expect(typeof res.body.id).toBe("string");
      expect(res.body.id).toHaveLength(36); // uuid v4
    });

    it("renvoie 400 si name absent", async () => {
      const res = await request(app).post(USERS_URL).send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Name required" });
    });

    it("persiste réellement le user dans db.json", async () => {
      const res = await request(app).post(USERS_URL).send({ name: "Diana" });

      const db = JSON.parse(await fs.readFile(DB_PATH, "utf-8"));
      expect(db.some((u) => u.id === res.body.id && u.name === "Diana")).toBe(
        true
      );
    });
  });

  describe(`GET ${USERS_URL}/:id`, () => {
    it("renvoie 200 et le bon user", async () => {
      const created = await createUser("Eve");
      const res = await request(app).get(`${USERS_URL}/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(created);
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await request(app).get(`${USERS_URL}/id-inconnu`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });
  });

  describe(`PUT ${USERS_URL}/:id`, () => {
    it("met à jour le name et conserve le même id", async () => {
      const created = await createUser("Frank");
      const res = await request(app)
        .put(`${USERS_URL}/${created.id}`)
        .send({ name: "Frank renommé" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.name).toBe("Frank renommé");
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await request(app)
        .put(`${USERS_URL}/id-inconnu`)
        .send({ name: "X" });

      expect(res.status).toBe(404);
    });

    it("renvoie 400 si name absent", async () => {
      const created = await createUser("Grace");
      const res = await request(app).put(`${USERS_URL}/${created.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Name required" });
    });
  });

  describe(`DELETE ${USERS_URL}/:id`, () => {
    it("supprime le user (204) qui n'est plus accessible ensuite", async () => {
      const created = await createUser("Heidi");

      const del = await request(app).delete(`${USERS_URL}/${created.id}`);
      expect(del.status).toBe(204);

      // le user supprimé renvoie maintenant 404
      const get = await request(app).get(`${USERS_URL}/${created.id}`);
      expect(get.status).toBe(404);
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await request(app).delete(`${USERS_URL}/id-inconnu`);

      expect(res.status).toBe(404);
    });
  });

  // Sous-ressource imbriquée : /api/v1/users/:userId/posts
  describe(`${USERS_URL}/:userId/posts`, () => {
    it("POST crée un post rattaché au user (201)", async () => {
      const user = await createUser("Auteur");

      const res = await request(app)
        .post(`${USERS_URL}/${user.id}/posts`)
        .send({ content: "Mon premier post" });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(user.id);
      expect(res.body.content).toBe("Mon premier post");
      expect(res.body.id).toHaveLength(36);
    });

    it("GET liste les posts du user et y retrouve le post créé", async () => {
      const user = await createUser("Liseur");
      const created = await request(app)
        .post(`${USERS_URL}/${user.id}/posts`)
        .send({ content: "Post à lister" });

      const res = await request(app).get(`${USERS_URL}/${user.id}/posts`);

      expect(res.status).toBe(200);
      expect(res.body.some((p) => p.id === created.body.id)).toBe(true);
    });

    it("POST renvoie 404 si le user n'existe pas", async () => {
      const res = await request(app)
        .post(`${USERS_URL}/id-inconnu/posts`)
        .send({ content: "x" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });

    it("POST renvoie 400 si le content est manquant (vérif légère)", async () => {
      const user = await createUser("SansContenu");

      const res = await request(app)
        .post(`${USERS_URL}/${user.id}/posts`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Content required" });
    });
  });
});
