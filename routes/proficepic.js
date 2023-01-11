const express = require("express");
const router = express.Router();
const ProfilePicController = require("../controllers/profilepic-controller");
const profilepicController = new ProfilePicController();
const jwtAuth = require('../middleware/jwt-auth');

router.put("/:id/profilepic", jwtAuth.verifyUser ,async (req, res) => await profilepicController.update(req, res));
router.delete("/:id/profilepic", jwtAuth.verifyUser ,async (req, res) => await profilepicController.delete(req, res));

module.exports = router;
