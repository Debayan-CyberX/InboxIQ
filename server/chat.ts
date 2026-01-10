/**
 * Chat endpoint - AI Assistant using Hugging Face
 */

const HF_MODEL = "tiiuae/falcon-7b-instruct";

async function generateWithHuggingFace(prompt: string): Promise<string> {
  const response = await fetch(
    `https://router.huggingface.co/models/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HF_API_KEY
          ? { Authorization: `Bearer ${process.env.HF_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HF API error: ${text}`);
  }

  const data = await response.json();

  // Different models return different shapes
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }

  if (data.generated_text) {
    return data.generated_text;
  }

  return "";
}

export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  // Build context-aware prompt
  const contextPrompt = `You are a helpful AI assistant for InboxIQ, an email management and lead tracking platform.

Context about InboxIQ:
- It helps users manage emails, track leads, and generate AI-powered email drafts
- Users can sync emails from Gmail, create AI drafts, track lead pipelines
- Features include inbox management, lead tracking, analytics, and AI-powered follow-ups

Previous conversation context:
${conversationHistory.length > 0 
  ? conversationHistory.slice(-3).map((msg) => 
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    ).join("\n")
  : "No previous context"
}

User's current message: ${message.trim()}

Instructions:
- Provide helpful, concise, and accurate responses
- Help users understand how to use InboxIQ features
- Answer questions about email management, lead tracking, and productivity
- Be friendly and professional
- Keep responses under 200 words unless the user asks for detailed explanations
- If asked about features, explain how they work in InboxIQ

Response:`;

  // Generate response using Hugging Face
  const aiResponse = await generateWithHuggingFace(contextPrompt);

  // Clean up the response
  let cleanResponse = aiResponse.trim();
  
  // Remove common AI prefixes if present
  cleanResponse = cleanResponse.replace(/^(Assistant|AI|Bot|InboxIQ):\s*/i, "");
  
  // Take first paragraph/sentence if multiple
  cleanResponse = cleanResponse.split("\n\n")[0].trim();
  cleanResponse = cleanResponse.split("\n")[0].trim();

  if (!cleanResponse || cleanResponse.length === 0) {
    cleanResponse = "I understand your question. Let me help you with that. Could you provide more details?";
  }

  return cleanResponse;
}
