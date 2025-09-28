import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { commands, testName, testDescription } = await request.json();

    if (!commands || !Array.isArray(commands) || commands.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No commands provided' },
        { status: 400 }
      );
    }

    // Generate Puppeteer script from commands
    const puppeteerScript = generatePuppeteerScript(commands, testName, testDescription);
    
    // Execute the test
    const result = await executePuppeteerTest(commands); // Pass commands instead of script

    return NextResponse.json({
      success: result.success,
      error: result.error,
      puppeteerScript: puppeteerScript, // Return the generated script
      executionTime: result.executionTime,
      screenshots: result.screenshots || []
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePuppeteerScript(commands, testName, testDescription) {
  let script = `// ${testName}\n`;
  script += `// ${testDescription}\n`;
  script += `// Generated on: ${new Date().toISOString()}\n\n`;
  
  script += `const puppeteer = require('puppeteer');\n\n`;
  script += `async function runTest() {\n`;
  script += `  const browser = await puppeteer.launch({ headless: true });\n`;
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
  script += `    // Take screenshot on failure\n`;
  script += `    await page.screenshot({ path: 'test-failure.png', fullPage: true });\n`;
  script += `    return { success: false, error: error.message };\n`;
  script += `    \n`;
  script += `  } finally {\n`;
  script += `    await browser.close();\n`;
  script += `  }\n`;
  script += `}\n\n`;
  script += `module.exports = { runTest };`;

  return script;
}

function generateCommandCode(command) {
  switch (command.action) {
    case 'navigate':
      return `    await page.goto('${command.url}', { waitUntil: 'networkidle2' });\n`;
      
    case 'waitForSelector':
      return `    await page.waitForSelector('${command.selector}', { timeout: 10000 });\n`;
      
    case 'type':
      return `    await page.type('${command.selector}', '${command.text}');\n`;
      
    case 'click':
      return `    await page.click('${command.selector}');\n`;
      
    case 'waitForNavigation':
      return `    await page.waitForNavigation({ waitUntil: 'networkidle2' });\n`;
      
    case 'screenshot':
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      return `    await page.screenshot({ path: '${filename}', fullPage: true });\n`;
      
    case 'waitForText':
      return `    await page.waitForFunction(\n      (text) => document.body.innerText.includes(text),\n      {},\n      '${command.text}'\n    );\n`;
      
    case 'selectOption':
      return `    await page.select('${command.selector}', '${command.value}');\n`;
      
    case 'hover':
      return `    await page.hover('${command.selector}');\n`;
      
    case 'scroll':
      return `    await page.evaluate(() => window.scrollTo(0, ${command.y || 'document.body.scrollHeight'}));\n`;
      
    case 'wait':
      const duration = command.duration || 1000;
      return `    await page.waitForTimeout(${duration});\n`;
      
    case 'getCookies':
      return `    const cookies = await page.cookies();\n    console.log('Cookies:', cookies);\n`;
      
    case 'setCookie':
      return `    await page.setCookie(${JSON.stringify(command.cookie)});\n`;
      
    case 'evaluate':
      return `    const result = await page.evaluate(() => {\n      ${command.code}\n    });\n    console.log('Evaluation result:', result);\n`;
      
    case 'assertText':
      return `    const element = await page.$('${command.selector}');\n    const text = await page.evaluate(el => el.textContent, element);\n    if (!text.includes('${command.expectedText}')) {\n      throw new Error('Text assertion failed: Expected "${command.expectedText}" but found "' + text + '"');\n    }\n`;
      
    case 'assertElementExists':
      return `    const elementExists = await page.$('${command.selector}') !== null;\n    if (!elementExists) {\n      throw new Error('Element assertion failed: Element "${command.selector}" not found');\n    }\n`;
      
    case 'clearInput':
      return `    await page.click('${command.selector}', { clickCount: 3 });\n    await page.keyboard.press('Backspace');\n`;
      
    default:
      return `    // Unknown command: ${command.action}\n    console.warn('Unknown command:', ${JSON.stringify(command)});\n`;
  }
}

async function executePuppeteerTest(commands) {
  const startTime = Date.now();
  
  try {
    // Import puppeteer directly
    const puppeteer = (await import('puppeteer')).default;
    
    // Execute the test directly
    const browser = await puppeteer.launch({ 
      headless: true,
      executablePath: '/usr/bin/google-chrome', // Use system Chrome
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // For Linux compatibility
    });
    const page = await browser.newPage();
    
    let testResult = { success: false, error: 'Unknown error' };
    let screenshots = [];
    
    try {
      console.log('Starting test execution...');
      
      // Execute commands dynamically
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`Step ${i + 1}: ${command.description}`);
        
        const commandResult = await executeCommand(page, command);
        if (commandResult && commandResult.screenshot) {
          screenshots.push(commandResult.screenshot);
        }
      }
      
      console.log('✅ Test completed successfully!');
      testResult = { success: true };
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      // Take screenshot on failure
      const failureScreenshot = `test-failure-${Date.now()}.png`;
      await page.screenshot({ 
        path: `public/screenshots/${failureScreenshot}`, 
        fullPage: true 
      });
      screenshots.push(failureScreenshot);
      testResult = { success: false, error: error.message };
    } finally {
      await browser.close();
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: testResult.success,
      error: testResult.error,
      executionTime: executionTime,
      screenshots: screenshots
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error.message,
      executionTime: executionTime
    };
  }
}

async function executeCommand(page, command) {
  switch (command.action) {
    case 'navigate':
      console.log(`Navigating to: ${command.url}`);
      await page.goto(command.url, { waitUntil: 'networkidle2', timeout: 30000 });
      break;
      
    case 'waitForSelector':
      console.log(`Waiting for selector: ${command.selector}`);
      await page.waitForSelector(command.selector, { timeout: 10000 });
      break;
      
    case 'type':
      console.log(`Typing into: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector);
      await page.type(command.selector, command.text, { delay: 50 });
      break;
      
    case 'click':
      console.log(`Clicking: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector);
      break;
      
    case 'waitForNavigation':
      console.log('Waiting for navigation...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      break;
      
    case 'screenshot':
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      console.log(`Taking screenshot: ${filename}`);
      await page.screenshot({ path: `public/screenshots/${filename}`, fullPage: true });
      return { screenshot: filename };
      
    case 'waitForText':
      console.log(`Waiting for text: ${command.text}`);
      await page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        { timeout: 10000 },
        command.text
      );
      break;
      
    case 'selectOption':
      console.log(`Selecting option in: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.select(command.selector, command.value);
      break;
      
    case 'hover':
      console.log(`Hovering over: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.hover(command.selector);
      break;
      
    case 'scroll':
      console.log('Scrolling page...');
      const scrollY = command.y || 'document.body.scrollHeight';
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(500);
      break;
      
    case 'wait':
      const duration = command.duration || 1000;
      console.log(`Waiting ${duration}ms...`);
      await page.waitForTimeout(duration);
      break;
      
    case 'getCookies':
      console.log('Getting cookies...');
      const cookies = await page.cookies();
      console.log('Current cookies:', cookies);
      break;
      
    case 'setCookie':
      console.log('Setting cookie...');
      await page.setCookie(command.cookie);
      break;
      
    case 'evaluate':
      console.log('Executing custom JavaScript...');
      const result = await page.evaluate(new Function(command.code));
      console.log('Evaluation result:', result);
      break;
      
    case 'assertText':
      console.log(`Asserting text in: ${command.selector}`);
      await page.waitForSelector(command.selector);
      const element = await page.$(command.selector);
      const text = await page.evaluate(el => el.textContent, element);
      if (!text.includes(command.expectedText)) {
        throw new Error(`Text assertion failed: Expected "${command.expectedText}" but found "${text}"`);
      }
      console.log('✅ Text assertion passed');
      break;
      
    case 'assertElementExists':
      console.log(`Asserting element exists: ${command.selector}`);
      const elementExists = await page.$(command.selector) !== null;
      if (!elementExists) {
        throw new Error(`Element assertion failed: Element "${command.selector}" not found`);
      }
      console.log('✅ Element assertion passed');
      break;
      
    case 'clearInput':
      console.log(`Clearing input: ${command.selector}`);
      await page.waitForSelector(command.selector);
      await page.click(command.selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      break;
      
    default:
      console.warn(`⚠️  Unknown command: ${command.action}`);
      break;
  }
  
  return null;
}