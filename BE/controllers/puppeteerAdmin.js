const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const launchPuppeteer = async () => {
    try {
        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: true, // Set to true to hide the browser window
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--start-maximized', // This argument can be ignored in headless mode
            ],
        });

        const page = await browser.newPage();

        // Set viewport to simulate screen dimensions
        const screenDimensions = { width: 1920, height: 1080 }; // Default to a standard screen size
        await page.setViewport(screenDimensions);

        // Navigate to admin page
        await page.goto(`${process.env.SOCKET_URL}/hidden123/avi-video`, { waitUntil: 'networkidle2' });

        // Wait for the video element to load and start playing (important!)
        await page.waitForSelector('[data-testid="video-element"]');
        console.log('Video element loaded.');

        //OPTIONAL - Wait for the video to start playing
        await page.evaluate(() => {
            const video = document.querySelector('[data-testid="video-element"]');
            return new Promise((resolve) => {
                video.onplaying = resolve;
            });
        });
        console.log('Video started playing.');


    } catch (error) {
        console.error("Error launching Puppeteer:", error);
    }
};

// Export the function so it can be used in `server.js`
module.exports = launchPuppeteer;
