const express = require('express');
const { registerAdmin, loginAdmin } = require('../controllers/admincontrollers');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post("/register",registerAdmin);
router.post("/login",loginAdmin);

module.exports = router;