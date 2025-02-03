const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const socketHandler = require('./socket');
const connectMySQL = require('./config/mysql'); 
const adminRoutes = require('./routes/adminroutes');
const userRoutes = require('./routes/clientroutes');
const gameRoutes = require('./routes/gameroutes');
const sequelize = require('./models/sequelize');
const launchPuppeteer = require('./controllers/puppeteerAdmin')
dotenv.config();

const PORT = process.env.PORT || 5000;

// Sync models
sequelize.sync()
  .then(() => console.log('Models synced...'))
  .catch(err => console.log('Error: ' + err));

// Wrapping MySQL connection in an async function to avoid top-level await
const initializeApp = async () => {
  const mysqlPool = await connectMySQL();
  const app = express();
  const server = http.createServer(app);

  // Middleware setup
  app.use(cors({ origin: '*', credentials: true }));
  app.use(bodyParser.json());
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Attach MySQL pool to requests
  app.use((req, res, next) => {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL pool not initialized' });
    }
    req.mysqlPool = mysqlPool;
    next();
  });

  const videosDir = path.join(__dirname, 'videos');
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);
  app.use('/videos', express.static(videosDir));


  app.get('/videos-list', (req, res) => {
    fs.readdir(videosDir, (err, files) => {
      if (err) {
        console.error('Error reading videos directory:', err);
        return res.status(500).json({ error: 'Unable to list videos' });
      }
      const videoFiles = files.filter((file) => /\.(mp4|mov|avi|mkv)$/i.test(file));
      res.status(200).json({ videos: videoFiles });
    });
  });

  app.use('/api/admin', adminRoutes);
  app.use('/api/client', userRoutes);
  app.use('/api/game', gameRoutes);
  socketHandler(server);

  server.listen(PORT, async () => {
    console.log(`Server is running on ${PORT}`);
    // await launchPuppeteer();
  });
};

initializeApp().catch((err) => {
  console.error('Error initializing application:', err);
});
