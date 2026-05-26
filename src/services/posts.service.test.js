const postsRepository = require("../repositories/posts.repository");
const usersRepository = require("../repositories/users.repository");
const postsService = require("./posts.service");

// On mocke les deux repositories pour isoler la logique du service.
jest.mock("../repositories/posts.repository");
jest.mock("../repositories/users.repository");

describe("postsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // La vérification légère, testée directement
  describe("validatePost", () => {
    it("passe pour un content valide", () => {
      expect(() => postsService.validatePost({ content: "ok" })).not.toThrow();
    });

    it("rejette un content absent, vide ou non-string", () => {
      expect(() => postsService.validatePost({})).toThrow("Content required");
      expect(() => postsService.validatePost({ content: "" })).toThrow(
        "Content required"
      );
      expect(() => postsService.validatePost({ content: "   " })).toThrow(
        "Content required"
      );
      expect(() => postsService.validatePost({ content: 42 })).toThrow(
        "Content required"
      );
    });

    it("rejette un content trop long (> 280)", () => {
      const long = "a".repeat(281);
      expect(() => postsService.validatePost({ content: long })).toThrow(
        "Content too long (max 280)"
      );
    });
  });

  describe("getPostsByUser", () => {
    it("renvoie les posts si le user existe", async () => {
      const posts = [{ id: "p1", userId: "u1", content: "a" }];
      usersRepository.getUserById.mockResolvedValue({ id: "u1", name: "Alice" });
      postsRepository.getPostsByUserId.mockResolvedValue(posts);

      const result = await postsService.getPostsByUser("u1");

      expect(result).toEqual(posts);
      expect(postsRepository.getPostsByUserId).toHaveBeenCalledWith("u1");
    });

    it("renvoie null si le user n'existe pas", async () => {
      usersRepository.getUserById.mockResolvedValue(null);

      const result = await postsService.getPostsByUser("inconnu");

      expect(result).toBeNull();
      // on ne va même pas chercher les posts d'un user inexistant
      expect(postsRepository.getPostsByUserId).not.toHaveBeenCalled();
    });
  });

  describe("createPost", () => {
    it("crée un post valide rattaché au user", async () => {
      usersRepository.getUserById.mockResolvedValue({ id: "u1", name: "Alice" });
      postsRepository.createPost.mockImplementation(async (post) => post);

      const result = await postsService.createPost("u1", { content: "  coucou  " });

      // le repo reçoit un post complet
      const arg = postsRepository.createPost.mock.calls[0][0];
      expect(arg.userId).toBe("u1");
      expect(arg.content).toBe("coucou"); // trimé
      expect(typeof arg.id).toBe("string");
      expect(arg.id).toHaveLength(36); // uuid v4
      expect(typeof arg.createdAt).toBe("string"); // date ISO
      expect(result).toEqual(arg);
    });

    it("renvoie null si le user n'existe pas (et ne crée rien)", async () => {
      usersRepository.getUserById.mockResolvedValue(null);

      const result = await postsService.createPost("inconnu", { content: "x" });

      expect(result).toBeNull();
      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });

    it("rejette un post invalide (et ne crée rien)", async () => {
      usersRepository.getUserById.mockResolvedValue({ id: "u1", name: "Alice" });

      await expect(postsService.createPost("u1", {})).rejects.toThrow(
        "Content required"
      );
      expect(postsRepository.createPost).not.toHaveBeenCalled();
    });
  });
});
