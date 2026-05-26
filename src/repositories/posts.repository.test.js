const fs = require("fs/promises");
const postsRepository = require("./posts.repository");

// On mocke fs/promises : aucun accès disque réel pendant les tests.
jest.mock("fs/promises");

const DB_PATH = "./src/database/posts.json";

describe("postsRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPosts", () => {
    it("lit et parse le contenu de posts.json", async () => {
      const posts = [{ id: "p1", userId: "u1", content: "hello" }];
      fs.readFile.mockResolvedValue(JSON.stringify(posts));

      const result = await postsRepository.getPosts();

      expect(fs.readFile).toHaveBeenCalledWith(DB_PATH);
      expect(result).toEqual(posts);
    });
  });

  describe("getPostsByUserId", () => {
    it("ne renvoie que les posts du user demandé", async () => {
      const posts = [
        { id: "p1", userId: "u1", content: "a" },
        { id: "p2", userId: "u2", content: "b" },
        { id: "p3", userId: "u1", content: "c" },
      ];
      fs.readFile.mockResolvedValue(JSON.stringify(posts));

      const result = await postsRepository.getPostsByUserId("u1");

      expect(result).toEqual([
        { id: "p1", userId: "u1", content: "a" },
        { id: "p3", userId: "u1", content: "c" },
      ]);
    });

    it("renvoie un tableau vide si le user n'a aucun post", async () => {
      fs.readFile.mockResolvedValue(
        JSON.stringify([{ id: "p1", userId: "u1", content: "a" }])
      );

      const result = await postsRepository.getPostsByUserId("u2");

      expect(result).toEqual([]);
    });
  });

  describe("createPost", () => {
    it("ajoute le post à la liste existante et réécrit le fichier", async () => {
      const existing = [{ id: "p1", userId: "u1", content: "a" }];
      fs.readFile.mockResolvedValue(JSON.stringify(existing));
      fs.writeFile.mockResolvedValue();
      const newPost = { id: "p2", userId: "u2", content: "b" };

      const result = await postsRepository.createPost(newPost);

      expect(result).toEqual(newPost);
      expect(fs.writeFile).toHaveBeenCalledWith(
        DB_PATH,
        JSON.stringify([...existing, newPost], null, 2)
      );
    });
  });
});
