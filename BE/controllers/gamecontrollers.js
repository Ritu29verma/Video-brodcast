const Game = require('../models/Game'); 

exports.getGames = async (req, res) => {
  try {
    const games = await Game.findAll({
      order: [['createdAt', 'DESC']], // Sort by createdAt in descending order
    });

    res.status(200).json({ success: true, data: games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};