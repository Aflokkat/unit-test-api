const postsService = require("../services/posts.service");
const postController = require("./post.controller");

// On mocke le service : on teste uniquement le controller (codes HTTP, format).
jest.mock("../services/posts.service");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("postController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByUser", () => {
    it("répond 200 avec les posts du user", async () => {
      const posts = [{ id: "p1", userId: "u1", content: "a" }];
      postsService.getPostsByUser.mockResolvedValue(posts);
      const req = { params: { userId: "u1" } };
      const res = mockRes();

      await postController.getByUser(req, res);

      expect(postsService.getPostsByUser).toHaveBeenCalledWith("u1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(posts);
    });

    it("répond 404 si le user n'existe pas (service renvoie null)", async () => {
      postsService.getPostsByUser.mockResolvedValue(null);
      const req = { params: { userId: "inconnu" } };
      const res = mockRes();

      await postController.getByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("répond 500 si le service échoue", async () => {
      postsService.getPostsByUser.mockRejectedValue(new Error("DB down"));
      const req = { params: { userId: "u1" } };
      const res = mockRes();

      await postController.getByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("create", () => {
    it("répond 201 avec le post créé", async () => {
      const post = { id: "p1", userId: "u1", content: "hello" };
      postsService.createPost.mockResolvedValue(post);
      const req = { params: { userId: "u1" }, body: { content: "hello" } };
      const res = mockRes();

      await postController.create(req, res);

      expect(postsService.createPost).toHaveBeenCalledWith("u1", {
        content: "hello",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(post);
    });

    it("répond 404 si le user n'existe pas (service renvoie null)", async () => {
      postsService.createPost.mockResolvedValue(null);
      const req = { params: { userId: "inconnu" }, body: { content: "x" } };
      const res = mockRes();

      await postController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("répond 400 si le post est invalide (service rejette)", async () => {
      postsService.createPost.mockRejectedValue(new Error("Content required"));
      const req = { params: { userId: "u1" }, body: {} };
      const res = mockRes();

      await postController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Content required" });
    });

    it("passe un objet vide au service si req.body est absent", async () => {
      postsService.createPost.mockResolvedValue(null);
      const req = { params: { userId: "u1" } };
      const res = mockRes();

      await postController.create(req, res);

      expect(postsService.createPost).toHaveBeenCalledWith("u1", {});
    });
  });
});
