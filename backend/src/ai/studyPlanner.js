import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are MemoryMesh's AI study planner for Indian school students in Classes 5-12.

Create a practical study plan using ONLY the information supplied by MemoryMesh.

The plan must:
- Focus on the selected subject and chapter when provided.
- Prioritize weak or poorly performing areas.
- Use existing notes, flashcards, and quiz performance.
- Respect the student's available minutes per day.
- Be realistic and concise.
- Never invent chapter content that is not supported by the supplied material.

Return ONLY valid JSON in exactly this structure:

{
  "title": "string",
  "overview": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "minutes": 20,
      "tasks": [
        "string",
        "string"
      ]
    }
  ]
}

Rules:
- Generate 3 to 7 days.
- Every day must contain at least 1 task.
- minutes must be a number.
- Keep tasks specific and actionable.
`;

export async function generateStudyPlan({
  subject,
  chapter,
  minutesPerDay,
  cards = [],
  notes = [],
  quizHistory = [],
}) {
  if (!subject) {
    throw new Error("Subject is required.");
  }

  const cardText = cards
    .map((card) => {
      return `
FLASHCARD
Question: ${card.question || ""}
Answer: ${card.answer || ""}
Mastery: ${Math.round((Number(card.p_l ?? 0)) * 100)}%
Reviews: ${card.reviewCount || 0}
Correct: ${card.correctCount || 0}
`;
    })
    .join("\n");

  const noteText = notes
    .map((note) => {
      return `
NOTE
Chapter: ${note.chapter || ""}
Tags: ${(note.tags || []).join(", ")}
Content: ${note.content || ""}
`;
    })
    .join("\n");

  const quizText = quizHistory
    .map((quiz) => {
      return `
QUIZ
Chapter: ${quiz.chapter || "General"}
Score: ${quiz.score}/${quiz.total}
Percentage: ${quiz.percentage}%
Completed: ${quiz.completedAt || ""}
`;
    })
    .join("\n");

  const prompt = `
Subject: ${subject}
Chapter: ${chapter || "All chapters"}
Available study time per day: ${minutesPerDay} minutes

STUDY MATERIAL
${noteText || "No notes available."}

FLASHCARDS
${cardText || "No flashcards available."}

QUIZ HISTORY
${quizText || "No quiz history available."}

Create a personalized study plan based on this information.
`;

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
        content: prompt.slice(0, 22000),
      },
    ],
  });

  const raw =
    response.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error(
      "The AI returned an empty study plan."
    );
  }

  return JSON.parse(raw);
}
