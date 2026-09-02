import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import "./Notes.css";

function renderMarkdown(text) {
  return String(text || "")
    .split("\n")
    .map((line, index) => {
      const value = line.trim();

      if (!value) {
        return <div key={index} className="notes-spacer" />;
      }

      if (value.startsWith("### ")) {
        return (
          <h4 key={index}>
            {value.slice(4)}
          </h4>
        );
      }

      if (value.startsWith("## ")) {
        return (
          <h3 key={index}>
            {value.slice(3)}
          </h3>
        );
      }

      if (value.startsWith("# ")) {
        return (
          <h2 key={index}>
            {value.slice(2)}
          </h2>
        );
      }

      if (value.startsWith("- ")) {
        return (
          <li key={index}>
            {value.slice(2)}
          </li>
        );
      }

      return (
        <p key={index}>
          {value}
        </p>
      );
    });
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");

  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  const loadNotes = async () => {
    try {
      setLoading(true);

      const params =
        subject !== "all"
          ? { subject }
          : {};

      const [notesResponse, subjectsResponse] =
        await Promise.all([
          client.get("/notes", { params }),
          client.get("/notes/subjects"),
        ]);

      setNotes(
        Array.isArray(notesResponse.data?.notes)
          ? notesResponse.data.notes
          : []
      );

      setSubjects(
        Array.isArray(subjectsResponse.data?.subjects)
          ? subjectsResponse.data.subjects
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load notes:",
        err
      );

      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [subject]);

  const filteredNotes = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.subject
          ?.toLowerCase()
          .includes(query) ||
        note.chapter
          ?.toLowerCase()
          .includes(query) ||
        note.content
          ?.toLowerCase()
          .includes(query) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        )
      );
    });
  }, [notes, search]);

  const toggleBookmark = async (
    note,
    event
  ) => {
    event.stopPropagation();

    try {
      const { data } =
        await client.post(
          `/notes/${note._id}/bookmark`
        );

      setNotes((current) =>
        current.map((item) =>
          item._id === note._id
            ? {
                ...item,
                bookmarkedBy:
                  data.bookmarked
                    ? [
                        ...(item.bookmarkedBy || []),
                        "current-user",
                      ]
                    : [],
                _bookmarked:
                  data.bookmarked,
              }
            : item
        )
      );

      setSelectedNote((current) =>
        current?._id === note._id
          ? {
              ...current,
              _bookmarked:
                data.bookmarked,
            }
          : current
      );
    } catch (err) {
      console.error(
        "Failed to bookmark note:",
        err
      );
    }
  };

  const isBookmarked = (note) => {
    if (note?._bookmarked !== undefined) {
      return note._bookmarked;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="page notes-page">
        <div className="notes-loading">
          <div className="loader" />
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page notes-page">

      <section className="notes-hero">

        <div>
          <span className="eyebrow">
            MEMORYMESH NOTES
          </span>

          <h1 className="brand">
            Study Notes
          </h1>

          <p className="subtitle">
            Read focused notes for your subjects and chapters.
          </p>
        </div>

        <div className="notes-hero-icon">
          📚
        </div>

      </section>

      <section className="card notes-toolbar">

        <div className="notes-search-wrap">
          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="notes-filter-wrap">

          <span>
            Subject
          </span>

          <select
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
          >
            <option value="all">
              All subjects
            </option>

            {subjects.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

        </div>

      </section>

      <div className="notes-results">

        <div>
          <strong>
            {filteredNotes.length}
          </strong>

          <span>
            notes available
          </span>
        </div>

        {search && (
          <span>
            Searching for "{search}"
          </span>
        )}

      </div>

      {filteredNotes.length === 0 ? (
        <section className="card notes-empty">

          <div className="notes-empty-icon">
            📝
          </div>

          <h2>
            No notes found
          </h2>

          <p>
            Try another subject or search term.
          </p>

        </section>
      ) : (
        <div className="notes-grid">

          {filteredNotes.map((note) => (
            <article
              key={note._id}
              className="card notes-card"
              onClick={() =>
                setSelectedNote(note)
              }
            >

              <div className="notes-card-top">

                <div className="notes-card-badges">

                  <span className="notes-subject">
                    {note.subject}
                  </span>

                  <span className="notes-source">
                    {note.source === "seed"
                      ? "NCERT"
                      : note.source === "upload"
                        ? "Uploaded"
                        : "My Note"}
                  </span>

                </div>

                <button
                  type="button"
                  className={
                    isBookmarked(note)
                      ? "notes-bookmark active"
                      : "notes-bookmark"
                  }
                  onClick={(event) =>
                    toggleBookmark(
                      note,
                      event
                    )
                  }
                  aria-label="Bookmark note"
                >
                  {isBookmarked(note)
                    ? "★"
                    : "☆"}
                </button>

              </div>

              <h2>
                {note.chapter}
              </h2>

              <p className="notes-preview">
                {String(note.content || "")
                  .replace(/[#*_`]/g, "")
                  .slice(0, 180)}
                {String(note.content || "")
                  .length > 180
                  ? "..."
                  : ""}
              </p>

              {note.tags?.length > 0 && (
                <div className="notes-tags">

                  {note.tags
                    .slice(0, 4)
                    .map((tag) => (
                      <span key={tag}>
                        #{tag}
                      </span>
                    ))}

                </div>
              )}

              <div className="notes-card-footer">

                <span>
                  Read note
                </span>

                <strong>
                  →
                </strong>

              </div>

            </article>
          ))}

        </div>
      )}

      {selectedNote && (
        <div
          className="notes-modal-backdrop"
          onClick={() =>
            setSelectedNote(null)
          }
        >

          <div
            className="notes-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="notes-modal-header">

              <div>

                <span className="notes-subject">
                  {selectedNote.subject}
                </span>

                <h2>
                  {selectedNote.chapter}
                </h2>

                <p>
                  {selectedNote.source === "seed"
                    ? "NCERT study note"
                    : selectedNote.source === "upload"
                      ? "Uploaded study note"
                      : "Personal study note"}
                </p>

              </div>

              <button
                type="button"
                className="notes-modal-close"
                onClick={() =>
                  setSelectedNote(null)
                }
              >
                ×
              </button>

            </div>

            <div className="notes-modal-content">
              {renderMarkdown(
                selectedNote.content
              )}
            </div>

            {selectedNote.tags?.length > 0 && (
              <div className="notes-modal-tags">
                {selectedNote.tags.map(
                  (tag) => (
                    <span key={tag}>
                      #{tag}
                    </span>
                  )
                )}
              </div>
            )}

            <div className="notes-modal-footer">

              <button
                type="button"
                className={
                  isBookmarked(
                    selectedNote
                  )
                    ? "notes-modal-bookmark active"
                    : "notes-modal-bookmark"
                }
                onClick={(event) =>
                  toggleBookmark(
                    selectedNote,
                    event
                  )
                }
              >
                {isBookmarked(selectedNote)
                  ? "★ Bookmarked"
                  : "☆ Bookmark"}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setSelectedNote(null)
                }
              >
                Done
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
