import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// Ensure Gemini API Key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SERVER_URL = "http://localhost:3000";

async function runTest() {
  console.log("1. Fetching registered tools from local MCP Server...");
  let statusData;
  try {
    const res = await fetch(`${SERVER_URL}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    statusData = await res.json();
  } catch (err) {
    console.error(`Failed to connect to MCP server at ${SERVER_URL}. Make sure to run 'npm run dev' first.`);
    process.exit(1);
  }

  const { tools } = statusData;
  console.log(`Found ${tools.length} tool(s):`, tools.map(t => t.name).join(", "));

  // Convert MCP tool formats to Gemini Function Declarations
  const functionDeclarations = tools.map(tool => {
    // Map parameters to Gemini properties
    const properties = {};
    const required = [];
    
    for (const [key, desc] of Object.entries(tool.parameters)) {
      const cleanDesc = String(desc);
      properties[key] = {
        type: "STRING",
        description: cleanDesc
      };
      if (cleanDesc.includes("required")) {
        required.push(key);
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "OBJECT",
        properties,
        required
      }
    };
  });

  const prompt = "Please check my Qlik tenant info for tenant 'me' and summarize its details.";
  console.log(`\n2. Sending prompt to Gemini: "${prompt}"`);

  // Call Gemini with the tools configuration
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ functionDeclarations }]
    }
  });

  // Check if Gemini wants to call a tool
  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    console.log(`\n3. Gemini requested tool execution: ${call.name}(${JSON.stringify(call.args)})`);

    // Execute the tool call via our Express test endpoint
    console.log("Executing tool request against local Qlik Sense MCP Server...");
    const toolRes = await fetch(`${SERVER_URL}/api/test-tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: call.name,
        args: call.args
      })
    });

    if (!toolRes.ok) {
      const errData = await toolRes.json();
      throw new Error(`Tool execution failed: ${errData.error}`);
    }

    const toolResult = await toolRes.json();
    console.log("Response from Qlik Sense API:", JSON.stringify(toolResult, null, 2));

    // Send the tool results back to Gemini for the final answer
    console.log("\n4. Submitting tool output back to Gemini to compile summary...");
    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { 
          role: "model", 
          parts: [{
            functionCall: {
              name: call.name,
              args: call.args
            }
          }] 
        },
        {
          role: "user",
          parts: [{
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          }]
        }
      ],
      config: {
        tools: [{ functionDeclarations }]
      }
    });

    console.log("\n5. Gemini's Final Answer:");
    console.log("=========================================");
    console.log(finalResponse.text);
    console.log("=========================================");

  } else {
    console.log("\nGemini did not trigger any tool calls.");
    console.log("Gemini's Response:", response.text);
  }
}

runTest().catch(console.error);
