import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama-3.1-8b-instant";
// Fast, free-tier friendly, production-safe

export async function generateWithGroq(
  prompt: string
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an AI sales assistant that writes concise, professional, human-sounding follow-up emails.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    return (
      completion.choices[0]?.message?.content?.trim() || ""
    );
  } catch (err: any) {
    console.error("Groq API error:", err);
    throw new Error("AI generation failed");
  }
}
