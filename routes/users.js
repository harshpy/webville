const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user-controller");
const jwtAuth = require('../middleware/jwt-auth');
const userController = new UserController();

router.post("/register", async (req, res) => await userController.create(req, res));
router.post("/login", async (req, res) => await userController.login(req, res));
router.put("/:id", jwtAuth.verifyUser, async (req, res) => await userController.update(req, res));
router.get("/:id", jwtAuth.verifyUser, async (req, res) => await userController.getSingle(req, res));
router.delete("/:id", jwtAuth.verifyUser, async (req, res) => await userController.delete(req, res));

module.exports = router;