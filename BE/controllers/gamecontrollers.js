const Game = require('../models/Game'); 
const UserGameResults = require('../models/UserGameResult')
const GameRangeSettings = require('../models/GameRangeSettings')

exports.getGames = async (req, res) => {
  try {
    const games = await Game.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ success: true, data: games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUsergameResults=  async (req, res) => {
  try {
    const { clientCode } = req.query;
    const results = await UserGameResults.findAll({
      where: { clientCode },
      order: [['createdAt', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error("Error fetching game results:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getAllgameResults =  async (req, res) => {
  try {
    const results = await UserGameResults.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error("Error fetching game results:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getGameRanges = async (req, res) => {
  const ranges = await GameRangeSettings.findAll();
  res.json(ranges);
};

exports.postGameRange = async (req, res) => {
  const { minTotalInGame, maxTotalInGame, minCoinReach, maxCoinReach } = req.body;
  const newRange = await GameRangeSettings.create({ minTotalInGame, maxTotalInGame, minCoinReach, maxCoinReach });
  res.json(newRange);
};

exports.editgameRange = async (req, res) => {
  const { minTotalInGame, maxTotalInGame, minCoinReach, maxCoinReach } = req.body;
  await GameRangeSettings.update(
    { minTotalInGame, maxTotalInGame, minCoinReach, maxCoinReach },
    { where: { id: req.params.id } }
  );
  res.json({ message: "Updated" });
};


exports.deleteGameRange=async (req, res) => {
  await GameRangeSettings.destroy({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
};

exports.checkgameId =  async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: "gameId is required" });
    }

    const gameExists = await Game.findOne({ where: { gameId } });

    return res.json({ exists: !!gameExists });
  } catch (error) {
    console.error("Error checking gameId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getmultipliers = async (req, res) => {
  try {
    const latestGames = await Game.findAll({
      attributes: ['coinReach'], // Fetch only coinReach
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const multipliers = latestGames
      .map(game => game.coinReach);


    res.json({ multipliers });
  } catch (error) {
    console.error('Error fetching latest games:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

