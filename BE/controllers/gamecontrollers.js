const Game = require('../models/Game'); 
const { getIo } = require('../socket');

let intervalId = null; // To track the interval timer

exports.startGame = async (req, res) => {
  try {
    const io = getIo();
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO instance is not available' });
    }

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    let currentMultiplier = 1.0; // Start multiplier
    const upcomingCoinReach = []; // Frontend will handle this part now

    // Emit multiplier updates every 100ms
    intervalId = setInterval(async () => {
      currentMultiplier = parseFloat((currentMultiplier + 0.1).toFixed(1)); // Increment by 0.1
      io.emit('update_multiplier', currentMultiplier);

      // Check against the next upcoming coinReach value (if any)
      if (upcomingCoinReach.length > 0 && currentMultiplier >= upcomingCoinReach[0]) {
        const targetCoinReach = upcomingCoinReach.shift(); 
      }
      // Trigger Video 3 if no upcoming values left
      if (upcomingCoinReach.length === 0 && currentMultiplier >= 15.0) { // Example threshold
        clearInterval(intervalId);
        intervalId = null;

        io.emit('hide_overlay');
        io.emit('start_video', { video: 3 });
      }
    }, 100); // Update every 100ms (10 numbers per second)

    res.status(200).json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.flyAway = async (req, res) => {
  try {
    const io = getIo();
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO instance is not available' });
    }

    // Stop multiplier updates
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    let finalMultiplier = req.body.currentMultiplier;

    // If coinReach is provided, use it, otherwise store the currentMultiplier
   
      const newGame = await Game.create({ coinReach: finalMultiplier });
      console.info("this is for button related coinreach set")
      console.log('Stored coinReach:', newGame.coinReach);
      io.emit('set_coin_reach', newGame.coinReach);
    

    // Start video 3 (Fly Away)
    io.emit('start_video', { video: 3 });
    res.status(200).json({ message: 'Fly Away triggered', coinReach:finalMultiplier });
  } catch (error) {
    console.error('Error handling Fly Away:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.setCoinReach = async (req, res) => {
  try {
    const { coinReach } = req.body;
    if (!coinReach) {
      return res.status(400).json({ error: 'coinReach value is required' });
    }

    // Store the coinReach in the database
    const newGame = await Game.create({ coinReach });
    console.info("this is for manual coinreach set")
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


exports.getAllGameResults = async (req, res) => {
  try {
    // Fetch all games from the database
    const games = await Game.findAll({
      attributes: ['gameId', 'coinReach', 'createdAt'], // Only fetch relevant fields
      order: [['createdAt', 'DESC']], // Order by most recent game first
    });

    res.status(200).json({
      success: true,
      message: 'Game results fetched successfully',
      data: games,
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};