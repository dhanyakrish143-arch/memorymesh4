import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [duelChallenges, setDuelChallenges] = useState([]);

  const loadFriends = async () => {
    try {
      const [
        friendsResponse,
        requestsResponse,
        duelResponse,
      ] = await Promise.all([
        client.get("/social"),
        client.get("/social/requests"),
        client.get("/duel/challenges"),
      ]);

      setFriends(
        friendsResponse.data?.friends || []
      );

      setRequests(
        requestsResponse.data?.requests || []
      );

      console.log(
        "[Friends] Duel challenges response:",
        duelResponse.data
      );

      setDuelChallenges(
        duelResponse.data?.duels || []
      );
    } catch (err) {
      console.error(
        "Failed to load friends:",
        err
      );

      setError(
        err.response?.data?.error ||
        "Failed to load friends."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();

    const interval = setInterval(() => {
      loadFriends();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const respondToDuel = async (duelId, action) => {
    try {
      setError("");

      const { data } = await client.post(
        `/duel/${duelId}/respond`,
        { action }
      );

      if (action === "accept" && data?.duel?.id) {
        navigate(`/duel?duel=${data.duel.id}`);
        return;
      }

      await loadFriends();
    } catch (err) {
      console.error("Duel response failed:", err);

      setError(
        err.response?.data?.error ||
        "Could not respond to duel."
      );
    }
  };
  const searchUsers = async (value) => {
    setSearch(value);
    setError("");

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);

      const { data } = await client.get(
        "/social/search",
        {
          params: { q: value.trim() },
        }
      );

      setResults(data?.users || []);
    } catch (err) {
      console.error(
        "Friend search failed:",
        err
      );

      setError(
        "Unable to search users."
      );
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await client.post(
        `/social/request/${userId}`
      );

      setResults((current) =>
        current.map((user) =>
          user._id === userId
            ? {
                ...user,
                relationship:
                  "request_sent",
              }
            : user
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Could not send request."
      );
    }
  };

  const respondToRequest = async (
    id,
    action
  ) => {
    try {
      await client.post(
        `/social/request/${id}/respond`,
        { action }
      );

      await loadFriends();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Could not respond to request."
      );
    }
  };

  if (loading) {
    return (
      <div className="page friends-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page friends-page">

      <section className="friends-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH SOCIAL
          </span>

          <h1>
            Friends
          </h1>

          <p>
            Connect with other learners and challenge
            them in future games.
          </p>
        </div>

        <div className="friends-hero-icon">
          👥
        </div>
      </section>

      {error && (
        <div className="friends-error">
          {error}
        </div>
      )}

      <section className="card friends-search-card">

        <span className="eyebrow">
          FIND FRIENDS
        </span>

        <h2>
          Search for a learner
        </h2>

        <p>
          Search by name or email.
        </p>

        <div className="friends-search">
          <span>🔍</span>

          <input
            value={search}
            onChange={(e) =>
              searchUsers(e.target.value)
            }
            placeholder="Search learners..."
          />

          {searching && (
            <span className="friends-searching">
              ...
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="friends-results">

            {results.map((user) => (
              <div
                key={user._id}
                className="friends-user-row"
              >

                <div className="friends-avatar">
                  {user.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="friends-user-info">
                  <strong>
                    {user.name}
                  </strong>

                  <span>
                    Class {user.class} · {user.board}
                  </span>
                </div>

                {user.relationship ===
                  "friends" && (
                  <span className="friends-status">
                    Friends ✓
                  </span>
                )}

                {user.relationship ===
                  "request_sent" && (
                  <span className="friends-status">
                    Request sent
                  </span>
                )}

                {user.relationship ===
                  "request_received" && (
                  <span className="friends-status">
                    Request waiting
                  </span>
                )}

                {user.relationship ===
                  "none" && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      sendRequest(user._id)
                    }
                  >
                    Add Friend
                  </button>
                )}

              </div>
            ))}

          </div>
        )}

      </section>

      {duelChallenges.length > 0 && (
        <section className="card friends-requests-card">

          <div className="friends-section-heading">
            <div>
              <span className="eyebrow">
                DUEL CHALLENGES
              </span>

              <h2>
                Ready for a match?
              </h2>
            </div>

            <strong>
              {duelChallenges.length}
            </strong>
          </div>

          <div className="friends-request-list">

            {duelChallenges.map((duel) => (
              <div
                key={duel._id}
                className="friends-request"
              >

                <div className="friends-avatar">
                  {duel.challenger?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="friends-user-info">
                  <strong>
                    {duel.challenger?.name}
                  </strong>

                  <span>
                    challenged you to a duel ⚔️
                  </span>
                </div>

                <div className="friends-request-actions">

                  <button
                    type="button"
                    className="friends-accept"
                    onClick={() =>
                      respondToDuel(
                        duel._id,
                        "accept"
                      )
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    className="friends-decline"
                    onClick={() =>
                      respondToDuel(
                        duel._id,
                        "decline"
                      )
                    }
                  >
                    Decline
                  </button>

                </div>

              </div>
            ))}

          </div>

        </section>
      )}
      {requests.length > 0 && (
        <section className="card friends-requests-card">

          <div className="friends-section-heading">
            <div>
              <span className="eyebrow">
                FRIEND REQUESTS
              </span>

              <h2>
                People who want to connect
              </h2>
            </div>

            <strong>
              {requests.length}
            </strong>
          </div>

          <div className="friends-request-list">

            {requests.map((request) => (
              <div
                key={request._id}
                className="friends-request"
              >

                <div className="friends-avatar">
                  {request.requester?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="friends-user-info">

                  <strong>
                    {request.requester?.name}
                  </strong>

                  <span>
                    Class{" "}
                    {request.requester?.class}
                    {" · "}
                    {request.requester?.board}
                  </span>

                </div>

                <div className="friends-request-actions">

                  <button
                    type="button"
                    className="friends-accept"
                    onClick={() =>
                      respondToRequest(
                        request._id,
                        "accept"
                      )
                    }
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    className="friends-decline"
                    onClick={() =>
                      respondToRequest(
                        request._id,
                        "decline"
                      )
                    }
                  >
                    Decline
                  </button>

                </div>

              </div>
            ))}

          </div>

        </section>
      )}

      <section className="card friends-list-card">

        <div className="friends-section-heading">

          <div>
            <span className="eyebrow">
              YOUR NETWORK
            </span>

            <h2>
              My Friends
            </h2>
          </div>

          <strong>
            {friends.length}
          </strong>

        </div>

        {friends.length === 0 ? (
          <div className="friends-empty">
            <div>👋</div>

            <h3>
              No friends yet
            </h3>

            <p>
              Search for another learner above to
              start building your network.
            </p>
          </div>
        ) : (
          <div className="friends-list">

            {friends.map((friend) => (
              <div
                key={friend._id}
                className="friends-user-row"
              >

                <div className="friends-avatar">
                  {friend.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="friends-user-info">

                  <strong>
                    {friend.name}
                  </strong>

                  <span>
                    Class {friend.class} ·{" "}
                    {friend.weeklyXp || 0} weekly XP
                  </span>

                </div>

                <span className="friends-streak">
                  🔥 {friend.streak || 0}
                </span>

                <button
                  type="button"
                  className="friends-duel-button"
                  onClick={() =>
                    navigate(
                      `/duel?opponent=${friend._id}`
                    )
                  }
                >
                  ⚔️ Challenge
                </button>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}





