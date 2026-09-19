import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Home from "./pages/Home";

import Upload from "./pages/Upload";
import Progress from "./pages/Progress";
import Cards from "./pages/Cards";
import Activity from "./pages/Activity";
import Achievements from "./pages/Achievements";
import Review from "./pages/Review";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import StudyAssistant from "./pages/StudyAssistant";
import Exam from "./pages/Exam";
import FocusMode from "./pages/FocusMode";
import Games from "./pages/Games";
import WordMatch from "./pages/WordMatch";
import RapidFire from "./pages/RapidFire";
import FillInStory from "./pages/FillInStory";
import TimelineDrop from "./pages/TimelineDrop";
import QuizHistory from "./pages/QuizHistory";


import Duel from "./pages/Duel";

function Private({ children }) {
  const { user } = useAuth();

  return user ? children : <Navigate to="/login" />;
}

function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  if (!user) return null;

  return (
    <div className="nav">
      <span className="nav-brand">MemoryMesh</span>

      <Link
        to="/"
        className={location.pathname === "/" ? "active" : ""}
      >
        Home
      </Link>
      <Link
        to="/games"
        className={location.pathname === "/games" ? "active" : ""}
      >
        Games
      </Link>
      <Link
        to="/upload"
        className={location.pathname === "/upload" ? "active" : ""}
      >
        Upload
      </Link>

      <Link
        to="/cards"
        className={location.pathname === "/cards" ? "active" : ""}
      >
        Flashcards
      </Link>

      <Link
        to="/progress"
        className={location.pathname === "/progress" ? "active" : ""}
      >
        Progress
      </Link>

      <Link
        to="/review"
        className={location.pathname === "/review" ? "active" : ""}
      >
        Review
      </Link>

      <Link
        to="/quiz"
        className={location.pathname === "/quiz" ? "active" : ""}
      >
        Quiz
      </Link>

      <Link
        to="/quiz-history"
        className={
          location.pathname === "/quiz-history"
            ? "active"
            : ""
        }
      >
        Quiz History
      </Link>

      <Link
        to="/activity"
        className={location.pathname === "/activity" ? "active" : ""}
      >
        Activity
      </Link>
<Link
        to="/achievements"
        className={
          location.pathname === "/achievements"
            ? "active"
            : ""
        }
      >
        Achievements
      </Link>

      <div className="nav-spacer" />

      <div className="nav-account" ref={accountRef}>
        <button
          type="button"
          className="nav-avatar-button"
          onClick={() =>
            setAccountOpen((current) => !current)
          }
          aria-label="Open account menu"
          aria-expanded={accountOpen}
        >
          {(user.name || user.email || "?")
            .charAt(0)
            .toUpperCase()}
        </button>

        {accountOpen && (
          <div className="nav-account-menu">

            <div className="nav-account-header">
              <span className="nav-account-avatar">
                {(user.name || user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <div>
                <strong>
                  {user.name || "User"}
                </strong>

                <span>
                  {user.email}
                </span>
              </div>
            </div>

            <div className="nav-account-divider" />

            <Link
              to="/profile"
              className="nav-account-item"
              onClick={() => setAccountOpen(false)}
            >
              <span>Profile</span>
            </Link>

            <Link
              to="/settings"
              className="nav-account-item"
              onClick={() => setAccountOpen(false)}
            >
              <span>Settings</span>
            </Link>

            <div className="nav-account-divider" />

            <Link
              to="/assistant"
              className="nav-account-item"
              onClick={() => setAccountOpen(false)}
            >
              <span>TutorAgent</span>
            </Link>

            <Link
              to="/exam"
              className="nav-account-item"
              onClick={() => setAccountOpen(false)}
            >
              <span>Exam Mode</span>
            </Link>

            <Link
              to="/focus"
              className="nav-account-item"
              onClick={() => setAccountOpen(false)}
            >
              <span>Focus Mode</span>
            </Link>

            <button
              type="button"
              className="nav-account-item nav-account-logout"
              onClick={logout}
            >
              <span>Logout</span>
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Nav />

      <Routes>
        <Route
          path="/quiz-history"
          element={
            <Private>
              <QuizHistory />
            </Private>
          }
        />
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <Private>
              <Home />
            </Private>
          }
        />


        <Route
          path="/upload"
          element={
            <Private>
              <Upload />
            </Private>
          }
        />

        <Route
          path="/progress"
          element={
            <Private>
              <Progress />
            </Private>
          }
        />
        <Route
          element={
            <Private>
            </Private>
          }
        />
        <Route
          path="/cards"
          element={
            <Private>
              <Cards />
            </Private>
          }
        />

        <Route
          path="/activity"
          element={
            <Private>
              <Activity />
            </Private>
          }
        />

        <Route
          path="/profile"
          element={
            <Private>
              <Profile />
            </Private>
          }
        />

        <Route
          path="/study-plan"
          element={
            <Private>
              
            </Private>
          }
        />
        <Route
          path="/assistant"
          element={
            <Private>
              <StudyAssistant />
            </Private>
          }
        />
        <Route
          path="/settings"
          element={
            <Private>
              <Settings />
            </Private>
          }
        />
          <Route
            path="/duel"
            element={
              <Private>
                <Duel />
              </Private>
            }
          />

<Route
          path="/achievements"
          element={
            <Private>
              <Achievements />
            </Private>
          }
        />

        <Route
          path="/review"
          element={
            <Private>
              <Review />
            </Private>
          }
        />
        <Route
          path="/timeline-drop"
          element={
            <Private>
              <TimelineDrop />
            </Private>
          }
        />
        <Route
          path="/fill-in-story"
          element={
            <Private>
              <FillInStory />
            </Private>
          }
        />
        <Route
          path="/rapid-fire"
          element={
            <Private>
              <RapidFire />
            </Private>
          }
        />
        <Route
          path="/word-match"
          element={
            <Private>
              <WordMatch />
            </Private>
          }
        />
        <Route
          path="/exam"
          element={
            <Private>
              <Exam />
            </Private>
          }
        />
        <Route
          path="/focus"
          element={
            <Private>
              <FocusMode />
            </Private>
          }
        />
        <Route
          path="/games"
          element={
            <Private>
              <Games />
            </Private>
          }
        />
        <Route
          path="/quiz"
          element={
            <Private>
              <Quiz />
            </Private>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}













































