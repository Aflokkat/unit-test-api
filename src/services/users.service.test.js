const usersRepository = require("../repositories/users.repository");
const usersService = require("./users.service");

// On remplace TOUT le repository par un mock automatique.
// But : tester la logique du service seule, sans toucher au disque (db.json).
// Chaque fonction du repository devient une fonction jest.fn() qu'on pilote.
jest.mock("../repositories/users.repository");

describe("usersService", () => {
  // Avant chaque test : on remet les mocks à zéro (compteurs d'appels,
  // valeurs de retour) pour que les tests soient indépendants entre eux.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("renvoie la liste fournie par le repository", async () => {
      const users = [{ id: "1", name: "Alice" }];
      usersRepository.getUsers.mockResolvedValue(users);

      const result = await usersService.getUsers();

      expect(result).toEqual(users);
      expect(usersRepository.getUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserById", () => {
    it("renvoie le user trouvé par le repository", async () => {
      const user = { id: "1", name: "Alice" };
      usersRepository.getUserById.mockResolvedValue(user);

      const result = await usersService.getUserById("1");

      expect(result).toEqual(user);
      expect(usersRepository.getUserById).toHaveBeenCalledWith("1");
    });

    it("renvoie null si le repository ne trouve rien", async () => {
      usersRepository.getUserById.mockResolvedValue(null);

      const result = await usersService.getUserById("inconnu");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("crée un user avec le name fourni et un id généré", async () => {
      // Arrange : le repo renvoie simplement l'objet qu'on lui passe
      usersRepository.createUser.mockImplementation(async (user) => user);

      // Act
      const result = await usersService.createUser("Alice");

      // Assert : le service a bien appelé le repo une fois...
      expect(usersRepository.createUser).toHaveBeenCalledTimes(1);
      // ...avec un objet { name, id } correct
      const arg = usersRepository.createUser.mock.calls[0][0]; // 1er arg du 1er appel
      expect(arg.name).toBe("Alice");
      expect(typeof arg.id).toBe("string");
      expect(arg.id).toHaveLength(36); // un uuid v4 fait 36 caractères
      // ...et il renvoie bien ce que le repo a retourné
      expect(result).toEqual(arg);
    });

    it("génère des id différents pour deux users", async () => {
      usersRepository.createUser.mockImplementation(async (user) => user);

      const a = await usersService.createUser("Alice");
      const b = await usersService.createUser("Bob");

      expect(a.id).not.toBe(b.id);
    });

    it("rejette avec 'Name required' si le name est absent", async () => {
      // undefined ET chaîne vide sont "falsy" -> les deux doivent échouer
      await expect(usersService.createUser()).rejects.toThrow("Name required");
      await expect(usersService.createUser("")).rejects.toThrow(
        "Name required"
      );
      // Le repo ne doit JAMAIS être appelé si la validation échoue
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it("propage l'erreur remontée par le repository", async () => {
      usersRepository.createUser.mockRejectedValue(new Error("DB down"));

      await expect(usersService.createUser("Alice")).rejects.toThrow("DB down");
    });
  });

  describe("updateUser", () => {
    it("met à jour le name via le repository", async () => {
      const updated = { id: "1", name: "Alice 2" };
      usersRepository.updateUser.mockResolvedValue(updated);

      const result = await usersService.updateUser("1", "Alice 2");

      // le service passe l'id et un objet { name } au repo
      expect(usersRepository.updateUser).toHaveBeenCalledWith("1", {
        name: "Alice 2",
      });
      expect(result).toEqual(updated);
    });

    it("renvoie null si le user n'existe pas", async () => {
      usersRepository.updateUser.mockResolvedValue(null);

      const result = await usersService.updateUser("inconnu", "X");

      expect(result).toBeNull();
    });

    it("rejette avec 'Name required' si le name est absent", async () => {
      await expect(usersService.updateUser("1")).rejects.toThrow(
        "Name required"
      );
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("renvoie true si le repository a supprimé", async () => {
      usersRepository.deleteUser.mockResolvedValue(true);

      const result = await usersService.deleteUser("1");

      expect(usersRepository.deleteUser).toHaveBeenCalledWith("1");
      expect(result).toBe(true);
    });

    it("renvoie false si le user n'existait pas", async () => {
      usersRepository.deleteUser.mockResolvedValue(false);

      const result = await usersService.deleteUser("inconnu");

      expect(result).toBe(false);
    });
  });
});
