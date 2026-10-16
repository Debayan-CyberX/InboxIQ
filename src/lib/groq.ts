import Groq from "groq-sdk";

const GROQ_MODEL = "llama-3.1-8b-instant";
// Fast, free-tier friendly, production-safe

// Centralized tone instructions
export const TONE_INSTRUCTIONS = {
  professional: "Use a formal, business-appropriate tone. Be courteous and respectful. Use complete sentences and proper grammar.",
  short: "Keep it brief and to the point. Use short sentences. Maximum 60 words. Be direct but friendly.",
  confident: "Write with confidence and assertiveness. Use strong, clear language. Show conviction without being pushy.",
  polite: "Be extra courteous and considerate. Use gentle language. Show respect and appreciation. Be warm and friendly.",
  "sales-focused": "Focus on value proposition and benefits. Be persuasive but not pushy. Highlight what's in it for them. Use compelling language."
} as const;

export type Tone = keyof typeof TONE_INSTRUCTIONS;

export interface GenerateAIOptions {
  systemPrompt?: string;
  tone?: Tone;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Centralized Groq AI generation helper
 * Reusable across all AI features: drafts, follow-ups, chat, action queue
 *
 * NOTE: Groq client is instantiated INSIDE the function (lazy init) so that
 * the module can be imported without a GROQ_API_KEY at startup time.
 * This is required for Cloudflare Workers, which validate module-level code
 * at deploy time before secrets are injected into process.env.
 */
export async function generateAI(
  prompt: string,
  options: GenerateAIOptions = {}
): Promise<string> {
  const {
    systemPrompt,
    tone,
    maxTokens = 300,
    temperature = 0.7,
  } = options;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Set it via: wrangler secret put GROQ_API_KEY");
  }

  // Lazy init: create per-call (Workers are stateless, no persistent module state)
  const groq = new Groq({ apiKey });

  // Build system message
  let systemContent = systemPrompt || "You are a helpful AI assistant that writes concise, professional, human-sounding content.";
  
  // Add tone instructions if specified
  if (tone && TONE_INSTRUCTIONS[tone]) {
    systemContent += ` ${TONE_INSTRUCTIONS[tone]}`;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (err: any) {
    console.error("Groq API error:", err);
    throw new Error("AI generation failed");
  }
}


/**
 * Legacy function - uses generateAI for backward compatibility
 * @deprecated Use generateAI instead
 */
export async function generateWithGroq(
  prompt: string
): Promise<string> {
  return generateAI(prompt, {
    systemPrompt: "You are an AI sales assistant that writes concise, professional, human-sounding follow-up emails.",
    temperature: 0.6,
  });
}
