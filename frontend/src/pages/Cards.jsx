import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const { data } = await client.get("/cards");
        setCards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load cards:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const filteredCards = useMemo(() => {
    const query = search.toLowerCase().trim();

    return cards.filter((card) => {
      const matchesSearch =
        !query ||
        card.question?.toLowerCase().includes(query) ||
        card.answer?.toLowerCase().includes(query) ||
        card.subject?.toLowerCase().includes(query) ||
        card.chapter?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "mastered" && card.mastered) ||
        (filter === "learning" && !card.mastered) ||
        (filter === "saved" && card.bookmarked);

      return matchesSearch && matchesFilter;
    });
  }, [cards, search, filter]);

  const toggleBookmark = async (id) => {
    try {
      const { data } = await client.patch(
        `/cards/${id}/bookmark`
      );

      setCards((current) =>
        current.map((card) =>
          card._id === id
            ? {
                ...card,
                bookmarked: data.bookmarked,
              }
            : card
        )
      );
    } catch (err) {
      console.error(
        "Failed to update bookmark:",
        err
      );
    }
  };

  const deleteCard = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) return;

    try {
      await client.delete(`/cards/${id}`);

      setCards((current) =>
        current.filter((card) => card._id !== id)
      );
    } catch (err) {
      console.error(
        "Failed to delete card:",
        err
      );
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading your cards...</p>
      </div>
    );
  }

  const savedCount = cards.filter(
    (card) => card.bookmarked
  ).length;

  return (
    <div className="page cards-page">

      <div className="cards-header">
        <div>
          <p className="eyebrow">
            MEMORYMESH
          </p>

          <h1 className="brand">
            Your Cards
          </h1>

          <p className="subtitle">
            Browse and manage your flashcards.
          </p>
        </div>

        <div className="cards-count">
          <strong>{cards.length}</strong>
          <span>cards</span>
        </div>
      </div>

      <div className="cards-toolbar">

        <input
          type="text"
          placeholder="Search your cards..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="cards-search"
        />

        <div className="cards-filters">

          <button
            type="button"
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "learning"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("learning")
            }
          >
            Learning
          </button>

          <button
            type="button"
            className={
              filter === "mastered"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("mastered")
            }
          >
            Mastered
          </button>

          <button
            type="button"
            className={
              filter === "saved"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("saved")
            }
          >
            ★ Saved ({savedCount})
          </button>

        </div>
      </div>

      <div className="cards-results">
        <span>
          Showing {filteredCards.length} of{" "}
          {cards.length} cards
        </span>
      </div>

      {filteredCards.length === 0 ? (
        <div className="card cards-empty">
          <h2>
            {filter === "saved"
              ? "No saved cards"
              : "No cards found"}
          </h2>

          <p>
            {filter === "saved"
              ? "Bookmark important cards and they will appear here."
              : "Try a different search or upload more study material."}
          </p>
        </div>
      ) : (
        <div className="cards-list">

          {filteredCards.map((card) => (
            <div
              className="card library-card"
              key={card._id}
            >

              <div className="library-card-top">

                <div>
                  {card.subject && (
                    <span className="card-subject">
                      {card.subject}
                    </span>
                  )}

                  {card.chapter && (
                    <span className="card-chapter">
                      {card.chapter}
                    </span>
                  )}
                </div>

                <div className="library-card-top-actions">

                  <button
                    type="button"
                    className={`bookmark-card-button ${
                      card.bookmarked
                        ? "saved"
                        : ""
                    }`}
                    onClick={() =>
                      toggleBookmark(card._id)
                    }
                    aria-label={
                      card.bookmarked
                        ? "Remove saved card"
                        : "Save card"
                    }
                    title={
                      card.bookmarked
                        ? "Remove from saved"
                        : "Save card"
                    }
                  >
                    {card.bookmarked
                      ? "★"
                      : "☆"}
                  </button>

                  <span
                    className={
                      card.mastered
                        ? "card-status mastered"
                        : "card-status learning"
                    }
                  >
                    {card.mastered
                      ? "✓ Mastered"
                      : "Learning"}
                  </span>

                </div>

              </div>

              <h2>
                {card.question}
              </h2>

              <p className="library-answer">
                {card.answer}
              </p>

              <div className="library-card-footer">

                <div className="library-card-stats">

                  <span>
                    Reviews:{" "}
                    {card.reviewCount || 0}
                  </span>

                  <span>
                    Correct:{" "}
                    {card.correctCount || 0}
                  </span>

                </div>

                <div className="library-card-actions">

                  <Link
                    to="/review"
                    className="study-card-button"
                  >
                    Study →
                  </Link>

                  <button
                    type="button"
                    className="delete-card-button"
                    onClick={() =>
                      deleteCard(card._id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
