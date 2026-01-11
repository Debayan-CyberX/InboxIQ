/**
 * Chat endpoint - AI Assistant using Groq
 */

import { generateAI } from "../src/lib/groq";

// ----------------------------------
// FALLBACK RESPONSES (UNCHANGED)
// ----------------------------------
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm your InboxIQ AI assistant. I can help you with:\n\n• Creating and managing email drafts\n• Tracking leads and pipelines\n• Syncing emails from Gmail\n• Understanding analytics and insights\n\nWhat would you like to know?";
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    if (lowerMessage.includes("create") || lowerMessage.includes("draft") || lowerMessage.includes("write")) {
      return "To create an AI email draft:\n\n1. Go to the Leads page\n2. Click on a lead\n3. Click 'Generate Follow-up'\n4. Choose a tone\n5. Review and send";
    }

    if (lowerMessage.includes("sync") || lowerMessage.includes("email")) {
      return "To sync emails:\n\n1. Go to Settings → Security\n2. Connect your Gmail\n3. Click the sync button (🔄)";
    }

    if (lowerMessage.includes("lead")) {
      return "Leads are automatically detected from emails. You can view, prioritize, and generate AI follow-ups from the Leads page.";
    }
  }

  if (
    lowerMessage.includes("draft") ||
    lowerMessage.includes("email") ||
    lowerMessage.includes("write")
  ) {
    return "InboxIQ lets you generate AI-powered follow-up emails with different tones. You can regenerate, edit, and send them directly.";
  }

  if (lowerMessage.includes("lead") || lowerMessage.includes("pipeline")) {
    return "Leads are auto-detected from email conversations and organized by status (Hot, Warm, Cold).";
  }

  if (lowerMessage.includes("sync") || lowerMessage.includes("gmail")) {
    return "Connect your Gmail account to sync emails and automatically detect leads.";
  }

  if (lowerMessage.includes("analytics") || lowerMessage.includes("performance")) {
    return "InboxIQ provides analytics on follow-ups, responses, and productivity insights.";
  }

  if (lowerMessage.includes("action") || lowerMessage.includes("queue")) {
    return "The Action Queue shows AI-prioritized tasks like follow-ups and drafts ready to send.";
  }

  return `I can help you with InboxIQ features like email drafts, lead tracking, analytics, and email sync.

Try asking:
• "How do I create a draft?"
• "How do I sync emails?"
• "What are leads?"`;
}

// ----------------------------------
// CHAT RESPONSE HANDLER (UNCHANGED)
// ----------------------------------
export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const contextPrompt = `You are a helpful AI assistant for InboxIQ.

Context:
InboxIQ helps users manage emails, track leads, and generate AI-powered follow-ups.

Previous conversation:
${
  conversationHistory.length > 0
    ? conversationHistory
        .slice(-3)
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n")
    : "No previous context"
}

User message:
${message.trim()}

Instructions:
- Be concise, helpful, and professional
- Explain InboxIQ features when relevant
- Keep responses under 200 words

Response:`;

    const aiResponse = await generateAI(contextPrompt, {
      systemPrompt: "You are a helpful AI assistant for InboxIQ, an email management and lead tracking platform. Be concise, helpful, and professional.",
      temperature: 0.7,
      maxTokens: 300,
    });

    let cleanResponse = aiResponse.trim();
    cleanResponse = cleanResponse.replace(/^(Assistant|AI|Bot|InboxIQ):\s*/i, "");
    cleanResponse = cleanResponse.split("\n\n")[0].split("\n")[0].trim();

    if (!cleanResponse) {
      return getFallbackResponse(message);
    }

    return cleanResponse;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return getFallbackResponse(message);
  }
}
