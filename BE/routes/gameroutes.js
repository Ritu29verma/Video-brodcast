const express = require('express');
const router = express.Router();
const {getGames,getAllgameResults,getUsergameResults} = require('../controllers/gamecontrollers'); 

router.get('/get-games', getGames);
router.get('/get-all-gameResults', getAllgameResults);
router.get('/get-user-gameResults', getUsergameResults);





module.exports = router;
