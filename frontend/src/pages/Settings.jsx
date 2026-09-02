import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  sessionSize: 10,
  dailyGoal: 10,
  startWeak: true,
  showTips: true,
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "memorymesh_settings"
      );

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch (err) {
      console.error(
        "Failed to load settings:",
        err
      );
    }
  }, []);

  const updateSetting = (key, value) => {
    setSaved(false);

    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(
      "memorymesh_settings",
      JSON.stringify(settings)
    );

    setSaved(true);
  };

  return (
    <div className="page settings-page">

      <section className="settings-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH SETTINGS
          </span>

          <h1 className="brand">
            Settings
          </h1>

          <p className="subtitle">
            Customize how you study and review.
          </p>
        </div>
      </section>

      <section className="card settings-card">

        <div className="settings-section">
          <span className="eyebrow">
            REVIEW
          </span>

          <h2>
            Review preferences
          </h2>

          <div className="settings-list">

            <div className="settings-row">
              <div>
                <strong>
                  Default session size
                </strong>

                <p>
                  Number of cards selected when you start a review.
                </p>
              </div>

              <select
                value={settings.sessionSize}
                onChange={(e) =>
                  updateSetting(
                    "sessionSize",
                    Number(e.target.value)
                  )
                }
              >
                <option value={10}>10 cards</option>
                <option value={20}>20 cards</option>
                <option value={30}>30 cards</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Start with weak cards
                </strong>

                <p>
                  Put lower-mastery cards first when reviewing.
                </p>
              </div>

              <button
                type="button"
                className={`settings-toggle ${
                  settings.startWeak ? "active" : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "startWeak",
                    !settings.startWeak
                  )
                }
                aria-pressed={settings.startWeak}
              >
                <span />
              </button>
            </div>

          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <span className="eyebrow">
            STUDY
          </span>

          <h2>
            Study preferences
          </h2>

          <div className="settings-list">

            <div className="settings-row">
              <div>
                <strong>
                  Daily review goal
                </strong>

                <p>
                  Set the number of reviews you want to complete each day.
                </p>
              </div>

              <select
                value={settings.dailyGoal}
                onChange={(e) =>
                  updateSetting(
                    "dailyGoal",
                    Number(e.target.value)
                  )
                }
              >
                <option value={5}>5 reviews</option>
                <option value={10}>10 reviews</option>
                <option value={20}>20 reviews</option>
                <option value={30}>30 reviews</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Study tips
                </strong>

                <p>
                  Show helpful hints during review sessions.
                </p>
              </div>

              <button
                type="button"
                className={`settings-toggle ${
                  settings.showTips ? "active" : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "showTips",
                    !settings.showTips
                  )
                }
                aria-pressed={settings.showTips}
              >
                <span />
              </button>
            </div>

          </div>
        </div>

        <div className="settings-footer">

          {saved && (
            <span className="settings-saved">
              ✓ Settings saved
            </span>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={saveSettings}
          >
            Save Settings
          </button>

        </div>

      </section>

    </div>
  );
}
