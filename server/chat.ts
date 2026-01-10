/**
 * Chat endpoint - AI Assistant using Hugging Face
 */

const HF_MODEL = "tiiuae/falcon-7b-instruct";

async function generateWithHuggingFace(prompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error(`HF API error (${response.status}):`, text);
      throw new Error(`HF API error: ${response.status} ${text.substring(0, 200)}`);
    }

    const data = await response.json();

    // Different models return different shapes
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }

    if (data.generated_text) {
      return data.generated_text;
    }

    // Handle error response from Hugging Face
    if (data.error) {
      console.error("HF API error response:", data.error);
      throw new Error(data.error);
    }

    return "";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout: Hugging Face API took too long to respond");
    }
    throw error;
  }
}

// Simple fallback responses for common queries
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm here to help you with InboxIQ. How can I assist you today?";
  }
  
  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    return "I can help you with InboxIQ features like managing emails, tracking leads, generating AI drafts, and more. What would you like to know?";
  }
  
  if (lowerMessage.includes("draft") || lowerMessage.includes("email")) {
    return "InboxIQ can help you create AI-powered email drafts! Go to the Drafts page to see your drafts and generate new ones with different tones.";
  }
  
  if (lowerMessage.includes("lead") || lowerMessage.includes("pipeline")) {
    return "You can track leads in the Leads page. Leads are automatically detected from your emails and can be organized by status (hot, warm, cold).";
  }
  
  if (lowerMessage.includes("sync") || lowerMessage.includes("gmail")) {
    return "To sync emails, go to Settings and connect your Gmail account. You can then use the sync button in the header to fetch new emails.";
  }
  
  return "I understand you're asking about: " + message + ". I'm having trouble connecting to the AI service right now, but I'd be happy to help once it's available. In the meantime, check out the InboxIQ documentation or try asking about specific features like drafts, leads, or email sync.";
}

export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
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
      cleanResponse = getFallbackResponse(message);
    }

    return cleanResponse;
  } catch (error) {
    console.error("Error generating chat response:", error);
    // Return fallback response instead of throwing
    return getFallbackResponse(message);
  }
}
