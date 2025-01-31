const express = require('express');
const router = express.Router();
const {getGames} = require('../controllers/gamecontrollers'); 

router.get('/get-games', getGames);


module.exports = router;
