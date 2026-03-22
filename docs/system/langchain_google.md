**LangChain/LangGraph in TypeScript fully supports Google AI Studio and Vertex AI Gemini models via the unified `@langchain/google` package.**

Use `ChatGoogle` with your `GOOGLE_API_KEY` for **both** Google AI Studio API and Vertex AI (specify `platformType: "gcp"` for Vertex).

## Setup

```bash
npm install @langchain/langgraph @langchain/core @langchain/google
```

Set your API key:

```bash
export GOOGLE_API_KEY="your-google-ai-studio-or-vertex-api-key"
```

For Vertex AI service account (if not using API key):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

## Google AI Studio (Gemini API)

```typescript
import { ChatGoogle } from "@langchain/google";
import { StateGraph, MessagesAnnotation, START, END, MemorySaver } from "@langchain/langgraph";

const model = new ChatGoogle({
  model: "gemini-2.5-flash",  // or "gemini-2.5-pro"
});

const workflow = new StateGraph({
  messages: MessagesAnnotation,
})
  .addNode("agent", (state) => {
    return model.invoke(state.messages);
  })
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile(new MemorySaver());

const result = await workflow.invoke({
  messages: [{ role: "user", content: "What's the weather?" }],
});
```

## Vertex AI

```typescript
const model = new ChatGoogle({
  model: "gemini-2.5-flash",
  platformType: "gcp",  // Enables Vertex AI features
  // Optional: projectId, location
});
```

Same LangGraph workflow applies. Supports context caching, grounding with Vertex AI Search, etc.

## Tool Calling Example

```typescript
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { bindTools } from "@langchain/core/messages";

const weatherTool = tool(async ({ city }) => {
  return `Sunny in ${city}!`;
}, {
  name: "get_weather",
  description: "Get weather",
  schema: z.object({ city: z.string() }),
});

const modelWithTools = model.bindTools([weatherTool]);

// Use in LangGraph node
.addNode("agent", async (state) => {
  const result = await modelWithTools.invoke(state.messages);
  return { messages: [result] };
})
```

Supports streaming, persistence (`MemorySaver`, `PostgresSaver`), human-in-the-loop, multimodal inputs.

**Relevant docs:**
- [Google integrations (JS/TS)](https://docs.langchain.com/oss/javascript/integrations/providers/google)
- [ChatGoogle](https://docs.langchain.com/oss/javascript/integrations/chat/google)
- [LangGraph Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [LangGraph Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
