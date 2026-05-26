const axios = require("axios");
const fs = require("fs/promises");
const app = require("./app");

const DB_PATH = "./src/database/db.json";
const POSTS_DB_PATH = "./src/database/posts.json";
const USERS_URL = "/api/v1/users";

// Tests d'INTÉGRATION (pas unitaires) : le vrai serveur Express est démarré et
// on l'interroge par de vraies requêtes HTTP via axios. Rien n'est mocké : on
// vérifie tout le CRUD de bout en bout (route -> controller -> service -> repo).
describe("API users (intégration HTTP)", () => {
  let server; // instance du serveur HTTP démarré
  let api; // client axios préconfiguré avec la baseURL
  let originalDb; // contenu réel de db.json, sauvegardé pour restauration
  let originalPosts; // contenu réel de posts.json, sauvegardé pour restauration

  // Helper : crée un user via l'API et renvoie l'objet créé (id + name)
  async function createUser(name) {
    const res = await api.post(USERS_URL, { name });
    return res.data;
  }

  beforeAll(async () => {
    // Sauvegarde des bases réelles pour les remettre à l'identique après coup
    originalDb = await fs.readFile(DB_PATH, "utf-8");
    originalPosts = await fs.readFile(POSTS_DB_PATH, "utf-8");

    // Serveur démarré sur le port 0 -> l'OS attribue un port libre.
    // listen() est asynchrone via callback, on l'enrobe dans une Promise.
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    const { port } = server.address();

    // validateStatus: () => true -> axios ne jette pas sur 4xx/5xx,
    // on inspecte res.status nous-mêmes.
    api = axios.create({
      baseURL: `http://localhost:${port}`,
      validateStatus: () => true,
    });
  });

  afterAll(async () => {
    // Restauration des bases + fermeture du serveur (sinon Jest ne se termine pas)
    await fs.writeFile(DB_PATH, originalDb);
    await fs.writeFile(POSTS_DB_PATH, originalPosts);
    await new Promise((resolve) => server.close(resolve));
  });

  describe("GET /", () => {
    it("renvoie 200 et 'Hello World!'", async () => {
      const res = await api.get("/");

      expect(res.status).toBe(200);
      expect(res.data).toBe("Hello World!");
    });
  });

  describe(`GET ${USERS_URL}`, () => {
    it("renvoie 200 et un tableau de users", async () => {
      const created = await createUser("Liste");
      const res = await api.get(USERS_URL);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      // le user qu'on vient de créer doit figurer dans la liste
      expect(res.data.some((u) => u.id === created.id)).toBe(true);
    });
  });

  describe(`POST ${USERS_URL}`, () => {
    it("crée un user et renvoie 201", async () => {
      const res = await api.post(USERS_URL, { name: "Charlie" });

      expect(res.status).toBe(201);
      expect(res.data.name).toBe("Charlie");
      expect(typeof res.data.id).toBe("string");
      expect(res.data.id).toHaveLength(36); // uuid v4
    });

    it("renvoie 400 si name absent", async () => {
      const res = await api.post(USERS_URL, {});

      expect(res.status).toBe(400);
      expect(res.data).toEqual({ error: "Name required" });
    });

    it("persiste réellement le user dans db.json", async () => {
      const res = await api.post(USERS_URL, { name: "Diana" });

      const db = JSON.parse(await fs.readFile(DB_PATH, "utf-8"));
      expect(db.some((u) => u.id === res.data.id && u.name === "Diana")).toBe(
        true
      );
    });
  });

  describe(`GET ${USERS_URL}/:id`, () => {
    it("renvoie 200 et le bon user", async () => {
      const created = await createUser("Eve");
      const res = await api.get(`${USERS_URL}/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.data).toEqual(created);
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await api.get(`${USERS_URL}/id-inconnu`);

      expect(res.status).toBe(404);
      expect(res.data).toEqual({ error: "User not found" });
    });
  });

  describe(`PUT ${USERS_URL}/:id`, () => {
    it("met à jour le name et conserve le même id", async () => {
      const created = await createUser("Frank");
      const res = await api.put(`${USERS_URL}/${created.id}`, {
        name: "Frank renommé",
      });

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(created.id);
      expect(res.data.name).toBe("Frank renommé");
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await api.put(`${USERS_URL}/id-inconnu`, { name: "X" });

      expect(res.status).toBe(404);
    });

    it("renvoie 400 si name absent", async () => {
      const created = await createUser("Grace");
      const res = await api.put(`${USERS_URL}/${created.id}`, {});

      expect(res.status).toBe(400);
      expect(res.data).toEqual({ error: "Name required" });
    });
  });

  describe(`DELETE ${USERS_URL}/:id`, () => {
    it("supprime le user (204) qui n'est plus accessible ensuite", async () => {
      const created = await createUser("Heidi");

      const del = await api.delete(`${USERS_URL}/${created.id}`);
      expect(del.status).toBe(204);

      // le user supprimé renvoie maintenant 404
      const get = await api.get(`${USERS_URL}/${created.id}`);
      expect(get.status).toBe(404);
    });

    it("renvoie 404 si l'id n'existe pas", async () => {
      const res = await api.delete(`${USERS_URL}/id-inconnu`);

      expect(res.status).toBe(404);
    });
  });

  // Sous-ressource imbriquée : /api/v1/users/:userId/posts
  describe(`${USERS_URL}/:userId/posts`, () => {
    it("POST crée un post rattaché au user (201)", async () => {
      const user = await createUser("Auteur");

      const res = await api.post(`${USERS_URL}/${user.id}/posts`, {
        content: "Mon premier post",
      });

      expect(res.status).toBe(201);
      expect(res.data.userId).toBe(user.id);
      expect(res.data.content).toBe("Mon premier post");
      expect(res.data.id).toHaveLength(36);
    });

    it("GET liste les posts du user et y retrouve le post créé", async () => {
      const user = await createUser("Liseur");
      const created = await api.post(`${USERS_URL}/${user.id}/posts`, {
        content: "Post à lister",
      });

      const res = await api.get(`${USERS_URL}/${user.id}/posts`);

      expect(res.status).toBe(200);
      expect(res.data.some((p) => p.id === created.data.id)).toBe(true);
    });

    it("POST renvoie 404 si le user n'existe pas", async () => {
      const res = await api.post(`${USERS_URL}/id-inconnu/posts`, {
        content: "x",
      });

      expect(res.status).toBe(404);
      expect(res.data).toEqual({ error: "User not found" });
    });

    it("POST renvoie 400 si le content est manquant (vérif légère)", async () => {
      const user = await createUser("SansContenu");

      const res = await api.post(`${USERS_URL}/${user.id}/posts`, {});

      expect(res.status).toBe(400);
      expect(res.data).toEqual({ error: "Content required" });
    });
  });
});
