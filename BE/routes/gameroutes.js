const express = require('express');
const router = express.Router();
const {startGame, flyAway, setCoinReach, getAllGameResults} = require('../controllers/gamecontrollers'); 

router.post('/set-coin-reach', setCoinReach);
router.post('/start-game', startGame);        // Route to start the game
router.post('/fly-away', flyAway); 
router.get('/games', getAllGameResults);

module.exports = router;
