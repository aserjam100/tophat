// puppeteer-api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Replace the regular puppeteer import with puppeteer-extra
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Use stealth plugin
puppeteer.use(StealthPlugin());

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);
app.use(express.json({ limit: "10mb" })); // Increase limit for screenshots

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Puppeteer API is running" });
});

// Main test execution endpoint
app.post("/api/run-test", async (req, res) => {
  try {
    const { commands, testName, testDescription } = req.body;

    if (!commands || !Array.isArray(commands) || commands.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No commands provided",
      });
    }

    // Generate Puppeteer script from commands
    const puppeteerScript = generatePuppeteerScript(
      commands,
      testName,
      testDescription
    );

    // Execute the test
    const result = await executePuppeteerTest(commands);

    return res.json({
      success: result.success,
      error: result.error,
      puppeteerScript: puppeteerScript,
      executionTime: result.executionTime,
      screenshots: result.screenshots || [],
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

function generatePuppeteerScript(commands, testName, testDescription) {
  let script = `// ${testName}\n`;
  script += `// ${testDescription}\n`;
  script += `// Generated on: ${new Date().toISOString()}\n\n`;

  script += `const puppeteer = require('puppeteer-extra');\n`;
  script += `const StealthPlugin = require('puppeteer-extra-plugin-stealth');\n`;
  script += `puppeteer.use(StealthPlugin());\n\n`;

  script += `async function runTest() {\n`;
  script += `  const browser = await puppeteer.launch({ \n`;
  script += `    headless: true,\n`;
  script += `    args: [\n`;
  script += `      '--no-sandbox',\n`;
  script += `      '--disable-setuid-sandbox',\n`;
  script += `      '--disable-blink-features=AutomationControlled'\n`;
  script += `    ]\n`;
  script += `  });\n`;
  script += `  const page = await browser.newPage();\n`;
  script += `  \n`;
  script += `  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');\n`;
  script += `  await page.setViewport({ width: 1920, height: 1080 });\n`;
  script += `  \n`;
  script += `  try {\n`;
  script += `    console.log('Starting test: ${testName}');\n\n`;

  // ... rest of your code
}

function generateCommandCode(command) {
  switch (command.action) {
    case "navigate":
      return `    await page.goto('${command.url}', { waitUntil: 'networkidle2' });\n`;

    case "waitForSelector":
      return `    await page.waitForSelector('${command.selector}', { timeout: 10000 });\n`;

    case "type":
      return `    await page.type('${command.selector}', '${command.text}');\n`;

    case "click":
      return `    await page.click('${command.selector}');\n`;

    case "waitForNavigation":
      return `    await page.waitForNavigation({ waitUntil: 'networkidle2' });\n`;

    case "screenshot":
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      return `    await page.screenshot({ path: '${filename}', fullPage: false });\n`;

    case "waitForText":
      return `    await page.waitForFunction(\n      (text) => document.body.innerText.includes(text),\n      {},\n      '${command.text}'\n    );\n`;

    case "selectOption":
      return `    await page.select('${command.selector}', '${command.value}');\n`;

    case "hover":
      return `    await page.hover('${command.selector}');\n`;

    case "scroll":
      return `    await page.evaluate(() => window.scrollTo(0, ${
        command.y || "document.body.scrollHeight"
      }));\n`;

    case "wait":
      const duration = command.duration || 1000;
      return `    await page.waitForTimeout(${duration});\n`;

    case "getCookies":
      return `    const cookies = await page.cookies();\n    console.log('Cookies:', cookies);\n`;

    case "setCookie":
      return `    await page.setCookie(${JSON.stringify(command.cookie)});\n`;

    case "evaluate":
      return `    const result = await page.evaluate(() => {\n      ${command.code}\n    });\n    console.log('Evaluation result:', result);\n`;

    case "assertText":
      return `    const element = await page.$('${command.selector}');\n    const text = await page.evaluate(el => el.textContent, element);\n    if (!text.includes('${command.expectedText}')) {\n      throw new Error('Text assertion failed: Expected "${command.expectedText}" but found "' + text + '"');\n    }\n`;

    case "assertElementExists":
      return `    const elementExists = await page.$('${command.selector}') !== null;\n    if (!elementExists) {\n      throw new Error('Element assertion failed: Element "${command.selector}" not found');\n    }\n`;

    case "clearInput":
      return `    await page.click('${command.selector}', { clickCount: 3 });\n    await page.keyboard.press('Backspace');\n`;

    default:
      return `    // Unknown command: ${
        command.action
      }\n    console.warn('Unknown command:', ${JSON.stringify(command)});\n`;
  }
}

async function executePuppeteerTest(commands) {
  const startTime = Date.now();

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-web-security",
      ],
    });
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    // Additional anti-detection measures
    await page.evaluateOnNewDocument(() => {
      // Overwrite the `plugins` property to use a custom getter
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Pass the Chrome Test
      window.chrome = {
        runtime: {},
      };

      // Pass the Permissions Test
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    let testResult = { success: false, error: "Unknown error" };
    let screenshots = [];

    try {
      console.log("Starting test execution...");

      // Execute commands dynamically
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`Step ${i + 1}: ${command.description}`);

        const commandResult = await executeCommand(page, command);
        if (commandResult && commandResult.screenshot) {
          screenshots.push(commandResult.screenshot);
        }
      }

      console.log("Test completed successfully!");
      testResult = { success: true };
    } catch (error) {
      console.error("Test failed:", error.message);

      // Take screenshot on failure and convert to base64
      try {
        const failureScreenshot = await page.screenshot({
          fullPage: false,
          type: "png",
        });

        const base64Screenshot = failureScreenshot.toString("base64");
        screenshots.push({
          filename: `test-failure-${Date.now()}.png`,
          data: `data:image/png;base64,${base64Screenshot}`,
          takenAt: new Date().toISOString(),
          type: "failure",
        });
      } catch (screenshotError) {
        console.error("Failed to capture failure screenshot:", screenshotError);
      }

      testResult = { success: false, error: error.message };
    } finally {
      await browser.close();
    }

    const executionTime = Date.now() - startTime;

    return {
      success: testResult.success,
      error: testResult.error,
      executionTime: executionTime,
      screenshots: screenshots,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      error: error.message,
      executionTime: executionTime,
      screenshots: [],
    };
  }
}

async function executeCommand(page, command) {
  switch (command.action) {
    case "navigate":
      console.log(`Navigating to: ${command.url}`);

      // Set user agent before navigation
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.setViewport({
        width: 1920,
        height: 1080,
      });

      await page.goto(command.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Check for Cloudflare challenge and wait for it to complete
      const maxWaitTime = 15000; // Maximum 15 seconds to wait for Cloudflare
      const startWait = Date.now();

      while (Date.now() - startWait < maxWaitTime) {
        const cloudflareDetected = await page.evaluate(() => {
          // Check for common Cloudflare indicators
          const bodyText = document.body.innerText || '';
          const title = document.title || '';

          return bodyText.includes('Verifying you are human') ||
                 bodyText.includes('Checking your browser') ||
                 title.includes('Just a moment') ||
                 document.querySelector('.cf-browser-verification') !== null ||
                 document.querySelector('#cf-challenge-running') !== null;
        });

        if (!cloudflareDetected) {
          console.log('Cloudflare challenge completed or not detected');
          break;
        }

        console.log('Cloudflare challenge detected, waiting...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Add a small delay after navigation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      break;

    case "waitForSelector":
      console.log(`Waiting for selector: ${command.selector}`);
      await page.waitForSelector(command.selector, { timeout: 10000 });
      break;

    case "type":
      console.log(`Typing into: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector);
      await page.type(command.selector, command.text, { delay: 50 });
      break;

    case "click":
      console.log(`Clicking: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector);
      break;

    case "waitForNavigation":
      console.log("Waiting for navigation or content load...");

      // Try navigation first, but don't fail if it times out
      const navigationPromise = page
        .waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 30000,
        })
        .catch(() => null);

      // Also wait for the URL to change OR a reasonable time
      const navigationResult = await Promise.race([
        navigationPromise,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);

      if (!navigationResult) {
        console.log("No traditional navigation detected (likely SPA)");
      }
      break;

    case "screenshot":
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      console.log(`Taking screenshot: ${filename}`);

      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: "png",
      });

      const base64Screenshot = screenshotBuffer.toString("base64");

      return {
        screenshot: {
          filename: filename,
          data: `data:image/png;base64,${base64Screenshot}`,
          takenAt: new Date().toISOString(),
          type: "success",
        },
      };

    case "waitForText":
      console.log(`Waiting for text: ${command.text}`);
      await page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        { timeout: 10000 },
        command.text
      );
      break;

    case "selectOption":
      console.log(`Selecting option in: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.select(command.selector, command.value);
      break;

    case "hover":
      console.log(`Hovering over: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.hover(command.selector);
      break;

    case "scroll":
      console.log("Scrolling page...");
      const scrollY = command.y || "document.body.scrollHeight";
      await page.evaluate((y) => {
        if (typeof y === "number") {
          window.scrollTo(0, y);
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      }, scrollY);
      await new Promise((resolve) => setTimeout(resolve, 500));
      break;

    case "wait":
      const duration = command.duration || 1000;
      console.log(`Waiting ${duration}ms...`);
      await new Promise((resolve) => setTimeout(resolve, duration));
      break;

    case "getCookies":
      console.log("Getting cookies...");
      const cookies = await page.cookies();
      console.log("Current cookies:", cookies);
      break;

    case "setCookie":
      console.log("Setting cookie...");
      await page.setCookie(command.cookie);
      break;

    case "evaluate":
      console.log("Executing custom JavaScript...");
      const result = await page.evaluate(new Function(command.code));
      console.log("Evaluation result:", result);
      break;

    case "assertText":
      console.log(`Asserting text in: ${command.selector}`);
      await page.waitForSelector(command.selector);
      const element = await page.$(command.selector);
      const text = await page.evaluate((el) => el.textContent, element);
      if (!text.includes(command.expectedText)) {
        throw new Error(
          `Text assertion failed: Expected "${command.expectedText}" but found "${text}"`
        );
      }
      console.log("Text assertion passed");
      break;

    case "assertElementExists":
      console.log(`Asserting element exists: ${command.selector}`);
      const elementExists = (await page.$(command.selector)) !== null;
      if (!elementExists) {
        throw new Error(
          `Element assertion failed: Element "${command.selector}" not found`
        );
      }
      console.log("Element assertion passed");
      break;

    case "clearInput":
      console.log(`Clearing input: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector, { clickCount: 3 });
      await page.keyboard.press("Backspace");
      break;

    default:
      console.warn(`Unknown command: ${command.action}`);
      break;
  }

  return null;
}

// Add this new endpoint after your existing routes
app.post("/api/scrape-form", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "No URL provided",
      });
    }

    console.log("Scraping form:", url);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
    const page = await browser.newPage();

    // Set realistic user agent and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    // Additional anti-detection measures
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      window.chrome = {
        runtime: {},
      };

      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Check for Cloudflare challenge and wait for it to complete
      const maxWaitTime = 15000;
      const startWait = Date.now();

      while (Date.now() - startWait < maxWaitTime) {
        const cloudflareDetected = await page.evaluate(() => {
          const bodyText = document.body.innerText || '';
          const title = document.title || '';

          return bodyText.includes('Verifying you are human') ||
                 bodyText.includes('Checking your browser') ||
                 title.includes('Just a moment') ||
                 document.querySelector('.cf-browser-verification') !== null ||
                 document.querySelector('#cf-challenge-running') !== null;
        });

        if (!cloudflareDetected) {
          console.log('Cloudflare challenge completed or not detected');
          break;
        }

        console.log('Cloudflare challenge detected, waiting...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Wait longer for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const fields = await page.evaluate(() => {
        // ... your existing evaluation code
      });

      await browser.close();

      console.log(`Found ${fields.length} fields`);

      return res.json({
        success: true,
        url: url,
        fields: fields,
        totalFields: fields.length,
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error("Scraping error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Puppeteer API running on port ${PORT}`);
});
