const Game = require('../models/Game'); 
const UserGameResults = require('../models/UserGameResult')

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