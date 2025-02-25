const express = require('express');
const router = express.Router();
const {getGames,getAllgameResults,getUsergameResults,getGameRanges,postGameRange,editgameRange,deleteGameRange,checkgameId,getmultipliers,getAllgameResultsdate,getGamesdate} = require('../controllers/gamecontrollers'); 

router.get('/get-games', getGames);
router.get('/get-games-date', getGamesdate);

router.get('/get-all-gameResults', getAllgameResults);
router.get('/get-all-gameResults-date', getAllgameResultsdate);

router.get('/get-user-gameResults', getUsergameResults);
router.get('/get-gameRanges', getGameRanges);
router.get('/get-multipliers', getmultipliers);
router.post('/set-gameRange',postGameRange);
router.get("/check-gameId",checkgameId);
router.put('/update-gameRange/:id',editgameRange);
router.delete('/delete-gameRange/:id',deleteGameRange);




module.exports = router;