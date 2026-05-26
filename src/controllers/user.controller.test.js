const usersService = require("../services/users.service");
const userController = require("./user.controller");

// On mocke le service : on teste UNIQUEMENT le controller (lecture de req,
// codes HTTP, format de la réponse). La logique métier est testée ailleurs.
jest.mock("../services/users.service");

// Faux objet `res` d'Express. status()/json()/send() renvoient `res` pour
// autoriser le chaînage (res.status(201).json(...)), comme le vrai Express.
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("répond 200 avec la liste des users", async () => {
      const users = [{ id: "1", name: "Alice" }];
      usersService.getUsers.mockResolvedValue(users);
      const res = mockRes();

      await userController.getAll({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });

    it("répond 500 si le service échoue", async () => {
      usersService.getUsers.mockRejectedValue(new Error("DB down"));
      const res = mockRes();

      await userController.getAll({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB down" });
    });
  });

  describe("getById", () => {
    it("répond 200 avec le user trouvé", async () => {
      const user = { id: "1", name: "Alice" };
      usersService.getUserById.mockResolvedValue(user);
      const req = { params: { id: "1" } };
      const res = mockRes();

      await userController.getById(req, res);

      expect(usersService.getUserById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("répond 404 si le user n'existe pas", async () => {
      usersService.getUserById.mockResolvedValue(null);
      const req = { params: { id: "inconnu" } };
      const res = mockRes();

      await userController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("create", () => {
    it("répond 201 avec le user créé", async () => {
      const user = { id: "1", name: "Alice" };
      usersService.createUser.mockResolvedValue(user);
      const req = { body: { name: "Alice" } };
      const res = mockRes();

      await userController.create(req, res);

      // le name extrait du body est passé au service...
      expect(usersService.createUser).toHaveBeenCalledWith("Alice");
      // ...et la réponse est un 201 contenant le user
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("répond 400 avec le message d'erreur si le service échoue", async () => {
      usersService.createUser.mockRejectedValue(new Error("Name required"));
      const req = { body: {} };
      const res = mockRes();

      await userController.create(req, res);

      // le catch traduit l'erreur en 400 + { error }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Name required" });
    });

    it("gère un body absent (req.body undefined) sans crasher", async () => {
      usersService.createUser.mockRejectedValue(new Error("Name required"));
      const req = {};
      const res = mockRes();

      await userController.create(req, res);

      // grâce au `req.body?.name`, on passe undefined au lieu de crasher
      expect(usersService.createUser).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("update", () => {
    it("répond 200 avec le user mis à jour", async () => {
      const user = { id: "1", name: "Alice 2" };
      usersService.updateUser.mockResolvedValue(user);
      const req = { params: { id: "1" }, body: { name: "Alice 2" } };
      const res = mockRes();

      await userController.update(req, res);

      expect(usersService.updateUser).toHaveBeenCalledWith("1", "Alice 2");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("répond 404 si le user n'existe pas", async () => {
      usersService.updateUser.mockResolvedValue(null);
      const req = { params: { id: "inconnu" }, body: { name: "X" } };
      const res = mockRes();

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("répond 400 si le service rejette (name manquant)", async () => {
      usersService.updateUser.mockRejectedValue(new Error("Name required"));
      const req = { params: { id: "1" }, body: {} };
      const res = mockRes();

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Name required" });
    });
  });

  describe("remove", () => {
    it("répond 204 sans corps si la suppression réussit", async () => {
      usersService.deleteUser.mockResolvedValue(true);
      const req = { params: { id: "1" } };
      const res = mockRes();

      await userController.remove(req, res);

      expect(usersService.deleteUser).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("répond 404 si le user n'existe pas", async () => {
      usersService.deleteUser.mockResolvedValue(false);
      const req = { params: { id: "inconnu" } };
      const res = mockRes();

      await userController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });
});
