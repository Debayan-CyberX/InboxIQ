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

// Enhanced fallback responses for common queries
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Greetings
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm your InboxIQ AI assistant. I can help you with:\n\n• Creating and managing email drafts\n• Tracking leads and pipelines\n• Syncing emails from Gmail\n• Understanding analytics and insights\n\nWhat would you like to know?";
  }
  
  // Help/How questions
  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    if (lowerMessage.includes("create") || lowerMessage.includes("draft") || lowerMessage.includes("write")) {
      return "To create an AI email draft:\n\n1. Go to the Leads page\n2. Click on a lead\n3. Click 'Generate Follow-up'\n4. Choose a tone (Professional, Short, Confident, etc.)\n5. Review and edit if needed\n6. Send or save as draft\n\nYou can also regenerate drafts with different tones!";
    }
    if (lowerMessage.includes("sync") || lowerMessage.includes("email")) {
      return "To sync emails:\n\n1. Go to Settings → Security\n2. Connect your Gmail account\n3. Click the sync button (🔄) in the header\n4. Your emails will appear in the Inbox page\n\nYou can also click the sync button anytime to fetch new emails!";
    }
    if (lowerMessage.includes("lead")) {
      return "Leads are automatically detected from your emails. To manage them:\n\n1. Go to the Leads page\n2. View leads by status (Hot, Warm, Cold)\n3. Click a lead to see details\n4. Generate follow-up emails for each lead\n\nLeads are organized by priority and need for follow-up.";
    }
    return "I can help you with InboxIQ features like:\n\n• 📧 Email drafts - Create AI-powered follow-ups\n• 👥 Lead tracking - Manage your sales pipeline\n• 📊 Analytics - View performance metrics\n• 🔄 Email sync - Connect Gmail and sync emails\n• 📝 Action queue - See prioritized tasks\n\nWhat specific feature would you like help with?";
  }
  
  // Draft/Email related
  if (lowerMessage.includes("draft") || lowerMessage.includes("email") || lowerMessage.includes("create") || lowerMessage.includes("write") || lowerMessage.includes("send")) {
    return "To create email drafts in InboxIQ:\n\n1. **From Leads page**: Click a lead → Generate Follow-up\n2. **From Drafts page**: View all your drafts\n3. **Choose a tone**: Professional, Short, Confident, Polite, or Sales-focused\n4. **Regenerate**: Try different tones for unique messages\n5. **Send**: Review and send directly\n\nThe AI generates personalized emails based on your conversation history with each lead!";
  }
  
  // Lead/Pipeline related
  if (lowerMessage.includes("lead") || lowerMessage.includes("pipeline") || lowerMessage.includes("contact") || lowerMessage.includes("prospect")) {
    return "Leads in InboxIQ:\n\n• **Auto-detected** from your email conversations\n• **Organized** by status (Hot, Warm, Cold)\n• **Tracked** with contact info and conversation history\n• **Prioritized** in the Action Queue\n\nGo to the Leads page to see all your leads, or check the dashboard for hot leads that need attention.";
  }
  
  // Sync/Gmail related
  if (lowerMessage.includes("sync") || lowerMessage.includes("gmail") || lowerMessage.includes("connect") || lowerMessage.includes("import")) {
    return "Email Sync in InboxIQ:\n\n1. **Connect**: Settings → Security → Connect Email\n2. **Sync**: Click the sync button (🔄) in the header\n3. **View**: Emails appear in your Inbox\n4. **Auto-detect**: Leads are automatically created from emails\n\nYou can sync Gmail accounts and the system will fetch new emails and create leads automatically!";
  }
  
  // Analytics/Metrics
  if (lowerMessage.includes("analytics") || lowerMessage.includes("stats") || lowerMessage.includes("metric") || lowerMessage.includes("performance")) {
    return "Analytics in InboxIQ:\n\n• View your email statistics\n• Track lead conversion rates\n• Monitor follow-up performance\n• See AI insight recommendations\n\nGo to the Analytics page to see detailed metrics and performance data.";
  }
  
  // Action Queue
  if (lowerMessage.includes("action") || lowerMessage.includes("queue") || lowerMessage.includes("task") || lowerMessage.includes("priority")) {
    return "The Action Queue shows:\n\n• AI-prioritized tasks\n• Leads needing follow-up\n• Drafts ready to review\n• Time-sensitive actions\n\nIt's on the dashboard and helps you focus on what matters most!";
  }
  
  // Default helpful response
  return `I'd be happy to help you with InboxIQ! Here's what I can assist with:

📧 **Email Drafts** - Create AI-powered follow-up emails
👥 **Lead Management** - Track and organize your contacts  
🔄 **Email Sync** - Connect and sync your Gmail
📊 **Analytics** - View performance metrics
📝 **Action Queue** - See prioritized tasks

Try asking:
• "How do I create a draft?"
• "How do I sync emails?"
• "What are leads?"
• "How does the action queue work?"

I'm here to help! What would you like to know?`;
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
