const express = require('express');
const router = express.Router();
const {setCoinReach} = require('../controllers/gamecontrollers'); 

router.post('/set-coin-reach', setCoinReach);

module.exports = router;
