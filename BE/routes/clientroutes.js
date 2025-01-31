const express = require('express');
const { checkClient,deductBetAmount,cashoutWallet,getWalletAmount } = require("../controllers/clientControllers") ;
const router = express.Router();

router.get('/login-client', checkClient);
router.get('/get-wallet-amount', getWalletAmount);
router.post('/cashoutWallet',cashoutWallet);
router.post('/deductBetAmount',deductBetAmount);

module.exports = router;