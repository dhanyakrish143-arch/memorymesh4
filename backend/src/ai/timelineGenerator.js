import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const TIMELINE_PROMPT = `
You are an NCERT curriculum expert for Indian students from Class 5-12.

Create a learning timeline or ordered sequence from the supplied study material.

Return ONLY valid JSON in exactly this structure:

{
  "type": "historical" | "process",
  "events": [
    {
      "order": 1,
      "date": null,
      "title": "Short event or step title",
      "description": "Short factual explanation"
    }
  ]
}

Rules:

1. For HISTORY and CIVICS material:
   - Use real years or dates when they are explicitly supported.
   - Set type to "historical".
   - date should contain the numeric year when available.
   - Never invent a historical date.

2. For SCIENCE, BIOLOGY, CHEMISTRY and other process-based material:
   - Set type to "process".
   - Do NOT invent years.
   - date must be null.
   - Create an ordered sequence of 3-5 important concepts, stages, steps, or processes from the material.
   - The order must follow the logical sequence taught by the material.

3. Generate exactly 5 items when enough material exists.
4. If only 3 or 4 reliable items exist, return those items.
5. Every event must be directly supported by the supplied material.
6. Keep titles short.
7. Keep descriptions under 30 words.
8. Return valid JSON only.
`;

export async function generateTimelineEvents(text) {
  if (!text || !text.trim()) {
    throw new Error("No study material supplied.");
  }

  const response =
    await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content: TIMELINE_PROMPT,
        },
        {
          role: "user",
          content: text.slice(0, 12000),
        },
      ],
    });

  const raw =
    response.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error(
      "Groq returned an empty timeline response."
    );
  }

  const parsed = JSON.parse(raw);

  if (
    !parsed ||
    !Array.isArray(parsed.events)
  ) {
    throw new Error(
      "Invalid timeline response."
    );
  }

  const type =
    parsed.type === "historical"
      ? "historical"
      : "process";

  const events = parsed.events
    .filter(
      (event) =>
        event &&
        typeof event.title === "string" &&
        typeof event.description === "string"
    )
    .map((event, index) => ({
      order: Number(event.order) || index + 1,
      date:
        event.date === null ||
        event.date === undefined ||
        event.date === ""
          ? null
          : Number(event.date),
      title: event.title.trim(),
      description:
        event.description.trim(),
    }))
    .filter(
      (event) =>
        event.title &&
        event.description &&
        (
          type === "process" ||
          Number.isFinite(event.date)
        )
    )
    .sort(
      (a, b) => a.order - b.order
    )
    .slice(0, 5);

  if (events.length < 2) {
    throw new Error(
      "Not enough reliable timeline items were found."
    );
  }

  /*
    For historical timelines, ensure actual dates
    determine chronological order.
  */
  if (type === "historical") {
    events.sort(
      (a, b) => a.date - b.date
    );
  }

  return {
    type,
    events: events.map(
      (event, index) => ({
        ...event,
        order: index + 1,
      })
    ),
  };
}
