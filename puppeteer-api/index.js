// puppeteer-api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

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

  script += `const puppeteer = require('puppeteer');\n\n`;
  script += `async function runTest() {\n`;
  script += `  const browser = await puppeteer.launch({ \n`;
  script += `    headless: true,\n`;
  script += `    args: ['--no-sandbox', '--disable-setuid-sandbox']\n`;
  script += `  });\n`;
  script += `  const page = await browser.newPage();\n`;
  script += `  \n`;
  script += `  try {\n`;
  script += `    console.log('Starting test: ${testName}');\n\n`;

  commands.forEach((command, index) => {
    script += `    // Step ${index + 1}: ${command.description}\n`;
    script += generateCommandCode(command);
    script += `\n`;
  });

  script += `    console.log('Test completed successfully!');\n`;
  script += `    return { success: true };\n`;
  script += `    \n`;
  script += `  } catch (error) {\n`;
  script += `    console.error('Test failed:', error.message);\n`;
  script += `    await page.screenshot({ path: 'test-failure.png', fullPage: true });\n`;
  script += `    return { success: false, error: error.message };\n`;
  script += `    \n`;
  script += `  } finally {\n`;
  script += `    await browser.close();\n`;
  script += `  }\n`;
  script += `}\n\n`;
  script += `runTest().then(result => console.log(result));`;

  return script;
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
      return `    await page.screenshot({ path: '${filename}', fullPage: true });\n`;

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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

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
          fullPage: true,
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
      await page.goto(command.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
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
      console.log("Waiting for navigation...");
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      break;

    case "screenshot":
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      console.log(`Taking screenshot: ${filename}`);

      const screenshotBuffer = await page.screenshot({
        fullPage: true,
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait a bit for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fields = await page.evaluate(() => {
        const inputs = Array.from(
          document.querySelectorAll(
            "input, textarea, select, button[type='submit']"
          )
        );

        return inputs
          .map((input, index) => {
            // Generate a reliable selector
            let selector = "";
            if (input.id) {
              selector = `#${input.id}`;
            } else if (input.name) {
              selector = `[name="${input.name}"]`;
            } else if (input.className) {
              const firstClass = input.className.split(" ")[0];
              selector = `.${firstClass}`;
            } else {
              selector = `${input.tagName.toLowerCase()}:nth-of-type(${
                index + 1
              })`;
            }

            // Get label text
            let label = "";
            if (input.labels && input.labels[0]) {
              label = input.labels[0].innerText.trim();
            } else if (input.placeholder) {
              label = input.placeholder;
            } else if (input.getAttribute("aria-label")) {
              label = input.getAttribute("aria-label");
            }

            // Get options for select elements
            let options = null;
            if (input.tagName === "SELECT") {
              options = Array.from(input.options).map((o) => ({
                text: o.text,
                value: o.value,
              }));
            }

            return {
              type: input.type || input.tagName.toLowerCase(),
              selector: selector,
              label: label || "Unlabeled field",
              required:
                input.required || input.getAttribute("required") !== null,
              placeholder: input.placeholder || "",
              name: input.name || "",
              id: input.id || "",
              options: options,
            };
          })
          .filter(
            (field) =>
              // Filter out hidden fields
              field.type !== "hidden" &&
              // Keep submit buttons
              (field.type !== "button" || field.selector.includes("submit"))
          );
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
