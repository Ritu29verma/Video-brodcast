const express = require('express');
const { registerAdmin, loginAdmin, getadminBalance } = require('../controllers/admincontrollers');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post("/register",registerAdmin);
router.post("/login",loginAdmin);
router.get("/getadminWallet",getadminBalance);

module.exports = router;