import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Upload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("file");

  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [saved, setSaved] = useState(false);

  const clearResult = () => {
    setResult(null);
    setSelected(new Set());
    setSaved(false);
    setError("");
    setSaveError("");
  };

  const handleFileChange = (e) => {
    const nextFile = e.target.files?.[0];

    if (!nextFile) return;

    setFile(nextFile);
    clearResult();
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    clearResult();
    setError("");
    setSaveError("");
  };

  const handleUpload = async () => {
    if (loading) return;

    if (mode === "file" && !file) {
      setError("Please choose a file first.");
      return;
    }

    if (mode === "text" && text.trim().length < 20) {
      setError("Please paste at least 20 characters of study text.");
      return;
    }

    setLoading(true);
    setError("");
    setSaveError("");
    setResult(null);
    setSaved(false);

    try {
      const formData = new FormData();

      if (mode === "file") {
        formData.append("file", file);
      } else {
        const textFile = new File(
          [text.trim()],
          "pasted-study-text.txt",
          {
            type: "text/plain",
          }
        );

        formData.append("file", textFile);
      }

      const { data } = await client.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(data);

      if (Array.isArray(data?.quiz)) {
        localStorage.setItem("memorymesh_quiz", JSON.stringify(data.quiz));
      }

      const cards = Array.isArray(data?.flashcards)
        ? data.flashcards
        : [];

      setSelected(
        new Set(cards.map((_, index) => index))
      );
    } catch (err) {
      console.error("Upload/generation failed:", err);

      setError(
        err.response?.data?.error ||
          "AI content generation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (index) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });

    setSaved(false);
    setSaveError("");
  };

  const selectAll = () => {
    if (!result?.flashcards) return;

    setSelected(
      new Set(
        result.flashcards.map((_, index) => index)
      )
    );

    setSaved(false);
    setSaveError("");
  };

  const clearAll = () => {
    setSelected(new Set());
    setSaved(false);
    setSaveError("");
  };

  const saveSelected = async () => {
    if (!result || selected.size === 0 || saving) {
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      const chosen = result.flashcards.filter(
        (_, index) => selected.has(index)
      );

      await client.post("/upload/save-cards", {
        flashcards: chosen,
        subject: result.subject,
        chapter: result.chapter_guess,
        class: result.class_guess,
      });

      setSaved(true);
    } catch (err) {
      console.error("Failed to save cards:", err);

      setSaveError(
        err.response?.data?.error ||
          "Could not save the cards. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const fileSize = file
    ? file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : "";

  const flashcards = result?.flashcards || [];
  const selectedCount = selected.size;
  const allSelected =
    flashcards.length > 0 &&
    selectedCount === flashcards.length;

  const textCharacters = text.length;

  return (
    <div className="page upload-page">

      <section className="upload-hero">
        <div>
          <span className="eyebrow">MEMORYMESH CREATOR</span>

          <h1 className="brand">
            Build your deck
          </h1>

          <p className="subtitle">
            Upload a study file or paste your notes directly.
            MemoryMesh will turn them into flashcards.
          </p>
        </div>

        <div className="upload-hero-badge">
          <span>Input options</span>
          <strong>File + Text</strong>
        </div>
      </section>

      <section className="card upload-panel">

        <div className="upload-mode-switch">

          <button
            type="button"
            className={mode === "file" ? "active" : ""}
            onClick={() => handleModeChange("file")}
          >
            📄 Upload File
          </button>

          <button
            type="button"
            className={mode === "text" ? "active" : ""}
            onClick={() => handleModeChange("text")}
          >
            ✏️ Paste Text
          </button>

        </div>

        {mode === "file" && (
          <>
            <div className="upload-dropzone">
              <input
                id="study-file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />

              <label
                htmlFor="study-file"
                className="upload-dropzone-content"
              >
                <div className="upload-icon">
                  {file ? "✓" : "+"}
                </div>

                <h2>
                  {file
                    ? "File selected"
                    : "Upload your study material"}
                </h2>

                <p>
                  {file
                    ? file.name
                    : "Choose a PDF, DOCX, or TXT file"}
                </p>

                {!file && (
                  <span className="upload-browse">
                    Browse files
                  </span>
                )}
              </label>
            </div>

            {file && (
              <div className="selected-file-card">
                <div className="selected-file-icon">
                  📄
                </div>

                <div>
                  <strong>{file.name}</strong>

                  <span>
                    {file.type || "Study document"} · {fileSize}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    clearResult();
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </>
        )}

        {mode === "text" && (
          <div className="upload-text-area">
            <div className="upload-text-header">
              <div>
                <span className="eyebrow">
                  STUDY TEXT
                </span>

                <h2>
                  Paste your notes
                </h2>

                <p>
                  Paste notes, textbook content, revision material,
                  or any study text below.
                </p>
              </div>

              <span className="upload-character-count">
                {textCharacters.toLocaleString()} characters
              </span>
            </div>

            <textarea
              className="study-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
                setSaved(false);
                setSaveError("");
              }}
              placeholder={`Paste your study material here...

Example:
Photosynthesis is the process by which green plants make food using sunlight, carbon dioxide, and water.`}
            />

            <div className="upload-text-footer">
              <span>
                Minimum 20 characters
              </span>

              <button
                type="button"
                onClick={() => {
                  setText("");
                  clearResult();
                }}
                disabled={!text}
              >
                Clear text
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={
            loading ||
            (mode === "file" && !file) ||
            (mode === "text" && text.trim().length < 20)
          }
          className="btn btn-primary btn-block upload-generate-button"
        >
          {loading
            ? "Generating flashcards..."
            : "Generate flashcards →"}
        </button>

        {error && (
          <div className="upload-message upload-error">
            <strong>Generation failed</strong>
            <span>{error}</span>
          </div>
        )}

      </section>

      {result && (
        <section className="upload-results">

          <div className="card upload-result-summary">

            <div>
              <span className="eyebrow">
                GENERATED CONTENT
              </span>

              <h2>
                {result.subject || "Study Material"}
              </h2>

              <p>
                {result.chapter_guess || "General chapter"}
                {result.class_guess
                  ? ` · Class ${result.class_guess}`
                  : ""}
              </p>
            </div>

            <div className="upload-result-count">
              <strong>{flashcards.length}</strong>
              <span>flashcards</span>
            </div>

          </div>

          {result.summary && (
            <div className="card upload-summary-card">
              <span className="eyebrow">
                SUMMARY
              </span>

              <p>{result.summary}</p>
            </div>
          )}

          <div className="upload-cards-header">

            <div>
              <span className="eyebrow">
                FLASHCARDS
              </span>

              <h2>
                Choose what to save
              </h2>

              <p>
                {selectedCount} of {flashcards.length} selected
              </p>
            </div>

            <div className="upload-selection-actions">

              <button
                type="button"
                onClick={selectAll}
                disabled={allSelected}
              >
                Select all
              </button>

              <button
                type="button"
                onClick={clearAll}
                disabled={selectedCount === 0}
              >
                Clear all
              </button>

            </div>
          </div>

          <div className="upload-flashcards-grid">
            {flashcards.map((card, index) => {
              const isSelected = selected.has(index);

              return (
                <label
                  key={index}
                  className={`generated-card ${
                    isSelected
                      ? "generated-card-selected"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCard(index)}
                  />

                  <div className="generated-card-check">
                    {isSelected ? "✓" : ""}
                  </div>

                  <div className="generated-card-content">

                    <span className="generated-card-label">
                      CARD {index + 1}
                    </span>

                    <h3>{card.question}</h3>

                    <div className="generated-answer">
                      {card.answer}
                    </div>

                  </div>
                </label>
              );
            })}
          </div>

          <div className="card upload-save-bar">

            <div>
              <strong>
                {selectedCount} card
                {selectedCount === 1 ? "" : "s"} selected
              </strong>

              <span>
                These will be added to your flashcard deck.
              </span>
            </div>

            <button
              type="button"
              onClick={saveSelected}
              disabled={
                selectedCount === 0 ||
                saving ||
                saved
              }
              className="btn btn-success"
            >
              {saving
                ? "Saving..."
                : saved
                  ? "Saved ✓"
                  : `Save ${selectedCount} card${
                      selectedCount === 1 ? "" : "s"
                    } →`}
            </button>

          </div>

          {saveError && (
            <div className="upload-message upload-error">
              <strong>Save failed</strong>
              <span>{saveError}</span>
            </div>
          )}

          {saved && (
            <div className="upload-message upload-success">
              <strong>
                Cards saved successfully ✓
              </strong>

              <span>
                Your new flashcards are now in your deck.
              </span>
            </div>
          )}

          {Array.isArray(result.quiz) && result.quiz.length > 0 && (
            <div className="upload-quiz-cta">
              <div>
                <span className="eyebrow">QUIZ MODE</span>
                <h3>Test yourself</h3>
                <p>
                  Try {result.quiz.length} quiz question
                  {result.quiz.length === 1 ? "" : "s"} from this material.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  navigate("/quiz", {
                    state: {
                      quiz: result.quiz,
                    },
                  })
                }
              >
                Start Quiz →
              </button>
            </div>
          )}

        </section>
      )}

    </div>
  );
}






