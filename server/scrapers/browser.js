import puppeteer from 'puppeteer';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let browserInstance = null;
let pagesOpened = 0;
const MAX_PAGES_BEFORE_RESTART = 50; // Restart browser periodically to free memory

const getLaunchOptions = () => {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
  ];

  if (config.proxyUrl) {
    // Puppeteer accepts basic proxy URLs like http://host:port
    // For socks5: socks5://host:port
    args.push(`--proxy-server=${config.proxyUrl}`);
  }

  const options = {
    headless: 'new',
    args
  };
  
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return options;
};

let browserLock = Promise.resolve();

export const getBrowser = async () => {
  let release;
  const lockPromise = new Promise(resolve => release = resolve);
  const previousLock = browserLock;
  browserLock = browserLock.then(() => lockPromise);

  await previousLock;

  try {
    if (pagesOpened >= MAX_PAGES_BEFORE_RESTART && browserInstance) {
      logger.info('Restarting Puppeteer browser to free memory...');
      await closeBrowserLocked();
    }

    if (!browserInstance) {
      logger.info('Launching new Puppeteer browser...');
      browserInstance = await puppeteer.launch(getLaunchOptions());
      pagesOpened = 0;
    }
    return browserInstance;
  } finally {
    release();
  }
};

const closeBrowserLocked = async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {
      logger.error('Error closing browser:', e.message);
    }
    browserInstance = null;
  }
};

export const closeBrowser = async () => {
  let release;
  const lockPromise = new Promise(resolve => release = resolve);
  const previousLock = browserLock;
  browserLock = browserLock.then(() => lockPromise);
  await previousLock;
  try {
    await closeBrowserLocked();
  } finally {
    release();
  }
};

export const getPage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  pagesOpened++;

  // Set realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Set default timeout
  page.setDefaultNavigationTimeout(20000);
  page.setDefaultTimeout(20000);

  // Block images, fonts, media, and stylesheets for faster scraping
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
};

// export const closeBrowser was replaced above
