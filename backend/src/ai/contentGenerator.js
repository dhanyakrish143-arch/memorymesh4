import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are an NCERT curriculum expert for Indian students from Class 5-12.

Analyze the provided study material and return ONLY valid JSON.

Return exactly this structure:

{
  "subject": "string",
  "chapter_guess": "string",
  "class_guess": 5,
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "quiz": [
    {
      "question": "string",
      "options": [
        "string",
        "string",
        "string",
        "string"
      ],
      "correct_index": 0,
      "explanation": "string"
    }
  ],
  "summary": "string"
}

Rules:
- Generate up to 10 flashcards.
- Generate up to 10 quiz questions.
- Every quiz question must have exactly 4 options.
- correct_index must be 0, 1, 2, or 3.
- Summary should be approximately 150 words.
- Stay faithful to the supplied study material.
- Return valid JSON only.
`;

export async function generateStudyContent(text) {
  try {
    if (!text || !text.trim()) {
      throw new Error("No study material was extracted from the uploaded file.");
    }

    console.log("AI: Sending extracted text to Groq...");
    console.log("AI: Text length:", text.length);

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.2,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: text.slice(0, 12000),
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Groq returned an empty response.");
    }

    console.log("AI: Groq response received.");

    return JSON.parse(raw);
  } catch (error) {
    console.error("========================================");
    console.error("GROQ AI ERROR");
    console.error("========================================");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Type:", error?.type);
    console.error("========================================");

    throw new Error("AI content generation failed. Please try again.");
  }
}