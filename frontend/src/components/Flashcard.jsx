import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import client from "../api/client";

export default function Flashcard({ card, onDone }) {
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  const revealAnswer = () => {
    if (!submitting && !aiLoading) {
      setFlipped(true);
    }
  };

  const explainWithAI = async () => {
    if (aiLoading || submitting) return;

    try {
      setAiLoading(true);
      setAiExplanation("");

      const { data } = await client.post(
        "/assistant/ask",
        {
          subject: card.subject || undefined,
          chapter: card.chapter || undefined,
          question: `
Explain this flashcard in simple student-friendly language.

Question:
${card.question}

Answer:
${card.answer}

Give:
1. A simple explanation
2. The key idea to remember
3. One short example, if useful

Stay faithful to the flashcard content.
`,
        }
      );

      setAiExplanation(
        data.answer ||
        "I couldn't generate an explanation."
      );
    } catch (err) {
      console.error(
        "Failed to explain flashcard with AI:",
        err
      );

      setAiExplanation(
        err.response?.data?.error ||
        "AI explanation failed. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (correct) => {
    if (submitting || aiLoading) return;

    try {
      setSubmitting(true);

      await client.post("/review/submit", {
        cardId: card._id,
        correct,
      });

      onDone(correct);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="flashcard-review">

      <motion.button
        type="button"
        className="flashcard-main"
        onClick={revealAnswer}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        disabled={flipped || submitting || aiLoading}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "answer" : "question"}
            className="flashcard-face"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <span className="flashcard-label">
              {flipped ? "ANSWER" : "QUESTION"}
            </span>

            <span className="flashcard-text">
              {flipped ? card.answer : card.question}
            </span>

            <span className="flashcard-tap">
              {flipped
                ? "How well did you remember it?"
                : "Tap to reveal the answer"}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {flipped && (
        <motion.div
          className="flashcard-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >

          <button
            type="button"
            className="flashcard-ai-button"
            disabled={submitting || aiLoading}
            onClick={explainWithAI}
          >
            <span className="flashcard-ai-icon">
              ✦
            </span>

            <span>
              <strong>
                {aiLoading
                  ? "Explaining..."
                  : "Explain with AI"}
              </strong>

              <small>
                {aiLoading
                  ? "MemoryMesh AI is thinking"
                  : "Get a simpler explanation"}
              </small>
            </span>
          </button>

          {aiExplanation && (
            <motion.div
              className="flashcard-ai-explanation"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <div className="flashcard-ai-explanation-header">
                <span>✦ MEMORYMESH AI</span>

                <button
                  type="button"
                  onClick={() =>
                    setAiExplanation("")
                  }
                  aria-label="Close explanation"
                >
                  ×
                </button>
              </div>

              <div className="flashcard-ai-content">
                <ReactMarkdown>
                  {aiExplanation}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          <div className="flashcard-review-choices">

            <button
              type="button"
              className="review-choice review-choice-wrong"
              disabled={submitting || aiLoading}
              onClick={() => submit(false)}
            >
              <span className="review-choice-icon">
                ×
              </span>

              <span>
                <strong>
                  Still learning
                </strong>

                <small>
                  I need more practice
                </small>
              </span>
            </button>

            <button
              type="button"
              className="review-choice review-choice-right"
              disabled={submitting || aiLoading}
              onClick={() => submit(true)}
            >
              <span className="review-choice-icon">
                ✓
              </span>

              <span>
                <strong>
                  Got it
                </strong>

                <small>
                  I remembered this
                </small>
              </span>
            </button>

          </div>

        </motion.div>
      )}

    </div>
  );
}
