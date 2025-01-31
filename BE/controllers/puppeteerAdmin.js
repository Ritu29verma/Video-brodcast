const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const launchPuppeteer = async () => {
  try {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true, // Set to true to hide the browser window
        args: [
          '--start-maximized', // This argument can be ignored in headless mode
        ],
      });
    
      const page = await browser.newPage();
    
      // Set viewport to simulate screen dimensions
      const screenDimensions = { width: 1920, height: 1080 }; // Default to a standard screen size
      await page.setViewport(screenDimensions);
    
      // Navigate to admin page
      await page.goto(`${process.env.SOCKET_URL}/admin`, { waitUntil: 'networkidle2' });
    
      // Click "Start Game" button twice
      const startGameButton = 'li:nth-child(1) > button';
      await page.click(startGameButton);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms = 1 second
    
    
    
      await page.click(startGameButton);
      console.log('Clicked "Start Game" button twice.');
  } catch (error) {
    console.error("Error launching Puppeteer:", error);
  }
};

// Export the function so it can be used in `server.js`
module.exports = launchPuppeteer;
