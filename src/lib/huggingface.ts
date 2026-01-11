const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

export async function generateWithHuggingFace(
  prompt: string
): Promise<string> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
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
          max_new_tokens: 250,
          temperature: 0.6,
          top_p: 0.9,
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

  // HF Inference API usually returns:
  // [{ generated_text: "..." }]
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }

  // Fallback safety
  if (typeof data?.generated_text === "string") {
    return data.generated_text;
  }

  throw new Error("HF API returned unexpected response shape");
}
