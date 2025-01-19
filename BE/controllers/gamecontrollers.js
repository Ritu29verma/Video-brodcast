const Game = require('../models/Game'); 
const { getIo } = require('../socket');

// exports.setCoinReach = async (req, res) => {
//   try {
//     const { coinReach } = req.body;
//     if (!coinReach) {
//       return res.status(400).json({ error: 'coinReach value is required' });
//     }

//     const newGame = await Game.create({ coinReach });
//     console.log(newGame.gameId);
//     res.status(201).json({ message: 'Coin reach value set successfully', game: newGame });
//   } catch (error) {
//     console.error('Error setting coin reach:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

exports.setCoinReach = async (req, res, io) => {
  try {
    const { coinReach } = req.body;
    if (!coinReach) {
      return res.status(400).json({ error: 'coinReach value is required' });
    }

    // Store the coinReach in the database
    const newGame = await Game.create({ coinReach });
    console.log('Stored coinReach:', newGame.coinReach);
    const io = getIo(); // Access the io instance
    if (io) {
      io.emit('set_coin_reach', coinReach); // Emit to all clients
    } else {
      console.error('Socket.IO instance is not available');
    }

    res.status(201).json({ message: 'Coin reach value set successfully', game: newGame });
  } catch (error) {
    console.error('Error setting coin reach:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

