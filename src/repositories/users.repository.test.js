const fs = require("fs/promises");
const usersRepository = require("./users.repository");

// On mocke fs/promises : aucun accès disque réel pendant les tests.
// readFile et writeFile deviennent des jest.fn() qu'on contrôle entièrement.
jest.mock("fs/promises");

const DB_PATH = "./src/database/db.json";

describe("usersRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("lit et parse le contenu de db.json", async () => {
      const users = [{ id: "1", name: "Alice" }];
      fs.readFile.mockResolvedValue(JSON.stringify(users));

      const result = await usersRepository.getUsers();

      expect(fs.readFile).toHaveBeenCalledWith(DB_PATH);
      expect(result).toEqual(users); // le texte JSON est bien transformé en objet
    });
  });

  describe("getUserById", () => {
    it("renvoie le user correspondant à l'id", async () => {
      const users = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      fs.readFile.mockResolvedValue(JSON.stringify(users));

      const result = await usersRepository.getUserById("2");

      expect(result).toEqual({ id: "2", name: "Bob" });
    });

    it("renvoie null si aucun user ne correspond", async () => {
      fs.readFile.mockResolvedValue(JSON.stringify([{ id: "1", name: "Alice" }]));

      const result = await usersRepository.getUserById("inconnu");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("ajoute le user à la liste existante et réécrit le fichier", async () => {
      const existing = [{ id: "1", name: "Alice" }];
      fs.readFile.mockResolvedValue(JSON.stringify(existing));
      fs.writeFile.mockResolvedValue();
      const newUser = { id: "2", name: "Bob" };

      const result = await usersRepository.createUser(newUser);

      expect(result).toEqual(newUser);
      // le fichier est réécrit avec ancien + nouveau, en JSON indenté (2 espaces)
      expect(fs.writeFile).toHaveBeenCalledWith(
        DB_PATH,
        JSON.stringify([...existing, newUser], null, 2)
      );
    });
  });

  describe("updateUser", () => {
    it("fusionne les champs, conserve l'id et réécrit le fichier", async () => {
      const existing = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      fs.readFile.mockResolvedValue(JSON.stringify(existing));
      fs.writeFile.mockResolvedValue();

      const result = await usersRepository.updateUser("2", { name: "Bobby" });

      expect(result).toEqual({ id: "2", name: "Bobby" });
      expect(fs.writeFile).toHaveBeenCalledWith(
        DB_PATH,
        JSON.stringify(
          [
            { id: "1", name: "Alice" },
            { id: "2", name: "Bobby" },
          ],
          null,
          2
        )
      );
    });

    it("renvoie null et n'écrit rien si l'user n'existe pas", async () => {
      fs.readFile.mockResolvedValue(JSON.stringify([{ id: "1", name: "Alice" }]));
      fs.writeFile.mockResolvedValue();

      const result = await usersRepository.updateUser("inconnu", {
        name: "X",
      });

      expect(result).toBeNull();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("retire le user, réécrit le fichier et renvoie true", async () => {
      const existing = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      fs.readFile.mockResolvedValue(JSON.stringify(existing));
      fs.writeFile.mockResolvedValue();

      const result = await usersRepository.deleteUser("1");

      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        DB_PATH,
        JSON.stringify([{ id: "2", name: "Bob" }], null, 2)
      );
    });

    it("renvoie false et n'écrit rien si l'user n'existe pas", async () => {
      fs.readFile.mockResolvedValue(JSON.stringify([{ id: "1", name: "Alice" }]));
      fs.writeFile.mockResolvedValue();

      const result = await usersRepository.deleteUser("inconnu");

      expect(result).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});
