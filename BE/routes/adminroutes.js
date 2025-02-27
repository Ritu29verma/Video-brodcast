const express = require('express');
const { registerAdmin, loginAdmin, getadminBalance, statsSummary, withdrawAmount} = require('../controllers/admincontrollers');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post("/register",registerAdmin);
router.post("/login",loginAdmin);
router.get("/getadminWallet",getadminBalance);
router.get('/stats-summary',statsSummary);
router.post('/withdraw', withdrawAmount);
module.exports = router;