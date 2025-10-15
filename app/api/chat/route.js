import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PUPPETEER_API_URL =
  process.env.PUPPETEER_API_URL || "http://localhost:3001";

const SYSTEM_PROMPT = `You are Mad Hatter, an expert QA automation assistant specializing in generating Puppeteer test commands. Your role is to:

1. When a user provides a URL to a form, use the scrape_form tool to analyze it first
2. Ask clarifying questions to understand what the user wants to test
3. Gather necessary details (URLs, selectors, test data, expected outcomes)
4. **When you have ALL information needed, generate test commands in a JSON code block**

**Available Commands:**
- navigate: {action: "navigate", url: "URL", description: "..."}
- waitForSelector: {action: "waitForSelector", selector: "CSS_SELECTOR", description: "..."}
- waitForSelectorPartial: {action: "waitForSelectorPartial", partialId: "PARTIAL_ID", description: "..."} // Wait for element with partial ID match
- type: {action: "type", selector: "CSS_SELECTOR", text: "TEXT", description: "..."}
- typePartial: {action: "typePartial", partialId: "PARTIAL_ID", text: "TEXT", description: "..."} // Type into element with partial ID
- click: {action: "click", selector: "CSS_SELECTOR", description: "..."}
- clickPartial: {action: "clickPartial", partialId: "PARTIAL_ID", description: "..."} // Click element with partial ID match
- wait: {action: "wait", duration: MILLISECONDS, description: "..."} // Wait for a specific duration (e.g., 10000 for 10 seconds)
- waitForNavigation: {action: "waitForNavigation", description: "..."}
- waitForText: {action: "waitForText", text: "TEXT", description: "..."}
- screenshot: {action: "screenshot", filename: "FILENAME.png", description: "..."}
- selectOption: {action: "selectOption", selector: "CSS_SELECTOR", value: "VALUE", description: "..."}

**CRITICAL CSS Selector Rules:**
- IDs MUST start with #: Use "#email" NOT "email"
- Classes MUST start with .: Use ".button" NOT "button"
- Attributes use brackets: Use "[name='email']" for name attributes
- Use the exact selectors provided by the scrape_form tool

**Your Workflow:**
1. If user provides a URL, use scrape_form tool immediately to analyze the form structure
2. After scraping, present the fields you found in a clear, organized way
3. Ask the user for the information needed to fill each field
4. **Once you have all information, generate commands in this EXACT format:**

\`\`\`json
{
  "testName": "Descriptive test name",
  "testDescription": "What this test does",
  "commands": [
    {action: "navigate", url: "...", description: "..."},
    {action: "type", selector: "#email", text: "user@example.com", description: "..."},
    // ... more commands
  ]
}
\`\`\`

**Important Rules:**
- Always use scrape_form when a URL is provided
- Use the exact selectors from the scraped data
- Generate commands ONLY when you have all necessary information
- Always wrap the final commands in a JSON code block with the exact format shown above
- Be conversational and guide the user through the process

**When to use Partial ID commands:**
- Use clickPartial, typePartial, or waitForSelectorPartial when the full ID is dynamic or unknown
- Only provide the distinctive part of the ID (e.g., "fleece-jacket" instead of "add-to-cart-sauce-labs-fleece-jacket")
`;

// Define the scrape_form tool
const tools = [
  {
    name: "scrape_form",
    description:
      "Scrapes a web form to identify all input fields, their types, labels, selectors, and requirements. Use this immediately when the user provides a URL to understand what fields exist on the form.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description:
            "The full URL of the form to scrape (must include http:// or https://)",
        },
      },
      required: ["url"],
    },
  },
];

// Function to call your Puppeteer API for scraping
async function scrapeFormFields(url) {
  try {
    const response = await fetch(`${PUPPETEER_API_URL}/api/scrape-form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Scraping failed");
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to scrape form: ${error.message}`);
  }
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // First call to Claude with tools
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages,
    });

    // Check if Claude wants to use a tool
    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find(
        (block) => block.type === "tool_use"
      );

      if (toolUse && toolUse.name === "scrape_form") {
        console.log("Scraping form:", toolUse.input.url);

        try {
          // Execute the scraping via your Render API
          const scrapedData = await scrapeFormFields(toolUse.input.url);

          // Continue conversation with tool result
          const followUpResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            tools: tools,
            messages: [
              ...messages,
              {
                role: "assistant",
                content: response.content,
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(scrapedData, null, 2),
                  },
                ],
              },
            ],
          });

          // Return ALL text content blocks concatenated
          const textBlocks = followUpResponse.content
            .filter((block) => block.type === "text")
            .map((block) => block.text);

          return NextResponse.json({
            content: textBlocks.join("\n\n"),
            id: followUpResponse.id,
            toolUsed: true,
            scrapedData: scrapedData,
          });
        } catch (scrapingError) {
          // If scraping fails, tell Claude and let it continue
          const errorResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            tools: tools,
            messages: [
              ...messages,
              {
                role: "assistant",
                content: response.content,
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    is_error: true,
                    content: `Failed to scrape form: ${scrapingError.message}`,
                  },
                ],
              },
            ],
          });

          const textBlocks = errorResponse.content
            .filter((block) => block.type === "text")
            .map((block) => block.text);

          return NextResponse.json({
            content: textBlocks.join("\n\n"),
            id: errorResponse.id,
            toolUsed: true,
            error: scrapingError.message,
          });
        }
      }
    }

    // Regular text response (no tool use)
    // Return ALL text blocks concatenated
    const textBlocks = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text);

    return NextResponse.json({
      content: textBlocks.join("\n\n"),
      id: response.id,
      toolUsed: false,
    });
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return NextResponse.json(
      { error: "Failed to get response from Claude", details: error.message },
      { status: 500 }
    );
  }
}
