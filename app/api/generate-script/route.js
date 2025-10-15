import { NextResponse } from 'next/server';

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

    return NextResponse.json({
      success: true,
      puppeteerScript: puppeteerScript
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
  script += `  const browser = await puppeteer.launch({ \n`;
  script += `    headless: true,\n`;
  script += `    defaultViewport: { width: 1280, height: 720 }\n`;
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

  script += `    console.log('✅ Test completed successfully!');\n`;
  script += `    return { success: true };\n`;
  script += `    \n`;
  script += `  } catch (error) {\n`;
  script += `    console.error('❌ Test failed:', error.message);\n`;
  script += `    // Take screenshot on failure\n`;
  script += `    await page.screenshot({ \n`;
  script += `      path: \`test-failure-\${Date.now()}.png\`, \n`;
  script += `      fullPage: true \n`;
  script += `    });\n`;
  script += `    return { success: false, error: error.message };\n`;
  script += `    \n`;
  script += `  } finally {\n`;
  script += `    await browser.close();\n`;
  script += `  }\n`;
  script += `}\n\n`;
  script += `// Run the test\n`;
  script += `if (require.main === module) {\n`;
  script += `  runTest().then(result => {\n`;
  script += `    console.log('Test result:', result);\n`;
  script += `    process.exit(result.success ? 0 : 1);\n`;
  script += `  }).catch(error => {\n`;
  script += `    console.error('Unexpected error:', error);\n`;
  script += `    process.exit(1);\n`;
  script += `  });\n`;
  script += `}\n\n`;
  script += `module.exports = { runTest };`;

  return script;
}

function generateCommandCode(command) {
  switch (command.action) {
    case 'navigate':
      return `    console.log('Navigating to: ${command.url}');\n    await page.goto('${command.url}', { waitUntil: 'networkidle2', timeout: 30000 });\n`;
      
    case 'waitForSelector':
      return `    console.log('Waiting for selector: ${command.selector}');\n    await page.waitForSelector('${command.selector}', { timeout: 10000 });\n`;
      
    case 'type':
      return `    console.log('Typing into: ${command.selector}');\n    await page.waitForSelector('${command.selector}');\n    await page.click('${command.selector}');\n    await page.type('${command.selector}', '${command.text}', { delay: 50 });\n`;
      
    case 'click':
      return `    console.log('Clicking: ${command.selector}');\n    await page.waitForSelector('${command.selector}', { visible: true });\n    await page.evaluate((selector) => {\n      const element = document.querySelector(selector);\n      if (element) {\n        element.scrollIntoView({ behavior: 'smooth', block: 'center' });\n        element.click();\n      }\n    }, '${command.selector}');\n    await page.waitForTimeout(500);\n`;

    case 'clickPartial':
      return `    console.log('Clicking element with partial ID: ${command.partialId}');\n    await page.waitForSelector('[id*="${command.partialId}"]', { visible: true });\n    await page.evaluate((selector) => {\n      const element = document.querySelector(selector);\n      if (element) {\n        element.scrollIntoView({ behavior: 'smooth', block: 'center' });\n        element.click();\n      }\n    }, '[id*="${command.partialId}"]');\n    await page.waitForTimeout(500);\n`;

    case 'typePartial':
      return `    console.log('Typing into element with partial ID: ${command.partialId}');\n    await page.waitForSelector('[id*="${command.partialId}"]');\n    await page.click('[id*="${command.partialId}"]');\n    await page.type('[id*="${command.partialId}"]', '${command.text}', { delay: 50 });\n`;

    case 'waitForSelectorPartial':
      return `    console.log('Waiting for element with partial ID: ${command.partialId}');\n    await page.waitForSelector('[id*="${command.partialId}"]', { timeout: 10000 });\n`;

    case 'waitForNavigation':
      return `    console.log('Waiting for navigation...');\n    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });\n`;
      
    case 'screenshot':
      const filename = command.filename || `screenshot-${Date.now()}.png`;
      return `    console.log('Taking screenshot: ${filename}');\n    await page.screenshot({ path: '${filename}', fullPage: true });\n`;
      
    case 'waitForText':
      return `    console.log('Waiting for text: ${command.text}');\n    await page.waitForFunction(\n      (text) => document.body.innerText.includes(text),\n      { timeout: 10000 },\n      '${command.text}'\n    );\n`;
      
    case 'selectOption':
      return `    console.log('Selecting option in: ${command.selector}');\n    await page.waitForSelector('${command.selector}');\n    await page.select('${command.selector}', '${command.value}');\n`;
      
    case 'hover':
      return `    console.log('Hovering over: ${command.selector}');\n    await page.waitForSelector('${command.selector}');\n    await page.hover('${command.selector}');\n`;
      
    case 'scroll':
      const scrollY = command.y || 'document.body.scrollHeight';
      return `    console.log('Scrolling page...');\n    await page.evaluate(() => window.scrollTo(0, ${scrollY}));\n    await page.waitForTimeout(500);\n`;
      
    case 'wait':
      const duration = command.duration || 1000;
      return `    console.log('Waiting ${duration}ms...');\n    await page.waitForTimeout(${duration});\n`;
      
    case 'getCookies':
      return `    console.log('Getting cookies...');\n    const cookies = await page.cookies();\n    console.log('Current cookies:', cookies);\n`;
      
    case 'setCookie':
      return `    console.log('Setting cookie...');\n    await page.setCookie(${JSON.stringify(command.cookie)});\n`;
      
    case 'evaluate':
      return `    console.log('Executing custom JavaScript...');\n    const result = await page.evaluate(() => {\n      ${command.code}\n    });\n    console.log('Evaluation result:', result);\n`;
      
    case 'assertText':
      return `    console.log('Asserting text in: ${command.selector}');\n    await page.waitForSelector('${command.selector}');\n    const element = await page.$('${command.selector}');\n    const text = await page.evaluate(el => el.textContent, element);\n    if (!text.includes('${command.expectedText}')) {\n      throw new Error(\`Text assertion failed: Expected "${command.expectedText}" but found "\${text}"\`);\n    }\n    console.log('✅ Text assertion passed');\n`;
      
    case 'assertElementExists':
      return `    console.log('Asserting element exists: ${command.selector}');\n    const elementExists = await page.$('${command.selector}') !== null;\n    if (!elementExists) {\n      throw new Error('Element assertion failed: Element "${command.selector}" not found');\n    }\n    console.log('✅ Element assertion passed');\n`;
      
    case 'clearInput':
      return `    console.log('Clearing input: ${command.selector}');\n    await page.waitForSelector('${command.selector}');\n    await page.click('${command.selector}', { clickCount: 3 });\n    await page.keyboard.press('Backspace');\n`;
      
    default:
      return `    // Unknown command: ${command.action}\n    console.warn('⚠️  Unknown command:', ${JSON.stringify(command)});\n`;
  }
}