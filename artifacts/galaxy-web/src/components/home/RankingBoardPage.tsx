// RankingBoardPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../lib/firebase";
import { UserProfile } from "../../lib/userService";

/* =========================================================
   TYPES
========================================================= */

type TabType = "Global" | "Friends" | "Weekly" | "Monthly";

interface RankingUser {
  uid: string;
  name: string;
  avatar: string;
  diamonds: number;
}

interface Props {
  user?: UserProfile;
  onBack?: () => void;
}

const TABS: TabType[] = ["Global", "Friends", "Weekly", "Monthly"];

function formatDiamonds(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.max(0, Math.round(value)));
}

function avatarIsImage(avatar: string): boolean {
  return avatar.startsWith("http") || avatar.startsWith("data:");
}

function periodScore(profile: UserProfile, tab: TabType): number {
  if (tab === "Global" || tab === "Friends") return profile.coins || 0;
  const duration = tab === "Weekly" ? 7 : 31;
  const since = Date.now() - duration * 24 * 60 * 60 * 1000;
  return Object.values(profile.transactions || {}).reduce((sum, tx) => {
    if (tx.timestamp < since || tx.amount <= 0) return sum;
    return sum + tx.amount;
  }, 0);
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RankingBoardPage({ user, onBack }: Props) {
  const [tab, setTab] = useState<TabType>("Global");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    setLoading(true);
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const value = snapshot.val() || {};
        setProfiles(
          Object.entries(value).map(([uid, profile]) => ({
            ...(profile as UserProfile),
            uid: (profile as UserProfile).uid || uid,
          }))
        );
        setLoadError("");
        setLoading(false);
      },
      () => {
        setLoadError("Unable to load live rankings right now.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const rankedUsers = useMemo<RankingUser[]>(() => {
    const friendIds = new Set([
      ...(user?.friendsList || []),
      ...(user?.followingList || []),
      ...(user?.uid ? [user.uid] : []),
    ]);
    return profiles
      .filter((profile) => tab !== "Friends" || friendIds.has(profile.uid))
      .map((profile) => ({
        uid: profile.uid,
        name: profile.name || "Galaxy User",
        avatar: profile.avatar || "👤",
        diamonds: periodScore(profile, tab),
      }))
      .sort((a, b) => b.diamonds - a.diamonds || a.name.localeCompare(b.name));
  }, [profiles, tab, user]);

  const podium = rankedUsers.slice(0, 3);
  const list = rankedUsers.slice(3);

  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  /* Lock body scroll on mount */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  return (
    <div className="rb-page">
      <div className="rb-app">
        {/* HEADER */}
        <div className="rb-header">
          <button
            className="rb-back"
            onClick={handleBack}
            aria-label="Back"
            type="button"
          >
            ‹
          </button>

          <div className="rb-header-text">
            <h1>Ranking Board</h1>
            <p>Top users with the most diamonds</p>
          </div>
        </div>

        {/* TABS */}
        <div className="rb-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`rb-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TITLE */}
        <div className="rb-title">
          <h2>Diamond Ranking</h2>
          <p>{tab} users with the most diamonds</p>
        </div>

        {loading ? (
          <div className="rb-state">Loading live rankings…</div>
        ) : loadError ? (
          <div className="rb-state">{loadError}</div>
        ) : rankedUsers.length === 0 ? (
          <div className="rb-state">
            {tab === "Friends" ? "No friends are ranked yet." : "No ranking data available yet."}
          </div>
        ) : (
          <>
            {/* PODIUM */}
            <div className="rb-podium">
              {second && (
                <div className="rb-person rb-second">
                  <div className="rb-avatar-wrap">
                    <div className="rb-crown">♔</div>
                    {avatarIsImage(second.avatar) ? (
                      <img className="rb-avatar" src={second.avatar} alt={second.name} />
                    ) : (
                      <div className="rb-avatar rb-avatar-text">{second.avatar}</div>
                    )}
                    <div className="rb-rank">2</div>
                  </div>
                  <div className="rb-pillar">
                    <div className="rb-name">{second.name}</div>
                    <div className="rb-diamonds"><span className="rb-diamond">💎</span>{formatDiamonds(second.diamonds)}</div>
                  </div>
                </div>
              )}

              {first && (
                <div className="rb-person rb-first">
                  <div className="rb-avatar-wrap">
                    <div className="rb-crown">♛</div>
                    {avatarIsImage(first.avatar) ? (
                      <img className="rb-avatar" src={first.avatar} alt={first.name} />
                    ) : (
                      <div className="rb-avatar rb-avatar-text">{first.avatar}</div>
                    )}
                    <div className="rb-rank">1</div>
                  </div>
                  <div className="rb-pillar">
                    <div className="rb-name">{first.name}</div>
                    <div className="rb-diamonds"><span className="rb-diamond">💎</span>{formatDiamonds(first.diamonds)}</div>
                  </div>
                </div>
              )}

              {third && (
                <div className="rb-person rb-third">
                  <div className="rb-avatar-wrap">
                    <div className="rb-crown">♔</div>
                    {avatarIsImage(third.avatar) ? (
                      <img className="rb-avatar" src={third.avatar} alt={third.name} />
                    ) : (
                      <div className="rb-avatar rb-avatar-text">{third.avatar}</div>
                    )}
                    <div className="rb-rank">3</div>
                  </div>
                  <div className="rb-pillar">
                    <div className="rb-name">{third.name}</div>
                    <div className="rb-diamonds"><span className="rb-diamond">💎</span>{formatDiamonds(third.diamonds)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* RANK LIST */}
            <div className="rb-rank-list">
              {list.map((rankedUser, index) => (
                <div key={rankedUser.uid} className={`rb-row ${index === 0 ? "highlight" : ""}`}>
                  <div className="rb-position">{index + 4}</div>
                  {avatarIsImage(rankedUser.avatar) ? (
                    <img className="rb-small-avatar" src={rankedUser.avatar} alt={rankedUser.name} />
                  ) : (
                    <div className="rb-small-avatar rb-small-avatar-text">{rankedUser.avatar}</div>
                  )}
                  <div className="rb-user-name">{rankedUser.name}</div>
                  <div className="rb-user-diamond"><span>💎</span> {formatDiamonds(rankedUser.diamonds)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .rb-page {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: #09072a;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          overflow-x: hidden;
          overflow-y: auto;
          animation: rbPageIn 0.25s ease;
        }
        .rb-page * {
          box-sizing: border-box;
        }

        @keyframes rbPageIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        .rb-app {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 20%, #4520a8 0%, #17104b 35%, #08072a 75%);
          padding-bottom: 90px;
        }

        /* ===== HEADER ===== */
        .rb-header {
          padding: 24px 18px 15px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .rb-back {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 29px;
          cursor: pointer;
          color: white;
          line-height: 1;
        }
        .rb-header-text h1 {
          font-size: 28px;
          line-height: 1.1;
          margin: 0;
        }
        .rb-header-text p {
          margin-top: 6px;
          color: #c6c2f4;
          font-size: 14px;
        }

        /* ===== TABS ===== */
        .rb-tabs {
          margin: 10px 14px 22px;
          height: 54px;
          border-radius: 30px;
          padding: 4px;
          display: flex;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }
        .rb-tab {
          flex: 1;
          border: 0;
          border-radius: 28px;
          color: #c8c5ee;
          background: transparent;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s ease;
        }
        .rb-tab.active {
          color: white;
          background: linear-gradient(135deg, #8c43ff, #7035ef);
          box-shadow: 0 5px 18px rgba(124,55,255,0.35);
        }

        /* ===== TITLE ===== */
        .rb-title { padding: 0 18px; }
        .rb-title h2 { font-size: 27px; margin: 0; }
        .rb-title p {
          color: #c3c0ef;
          font-size: 14px;
          margin-top: 5px;
        }

        /* ===== PODIUM ===== */
        .rb-podium {
          height: 350px;
          position: relative;
          margin: 5px 10px 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 5px;
        }
        .rb-person {
          width: 32%;
          text-align: center;
          position: relative;
        }
        .rb-person.rb-first {
          width: 36%;
          z-index: 2;
        }
        .rb-avatar-wrap {
          position: relative;
          margin: auto;
        }
        .rb-first .rb-avatar-wrap {
          width: 118px;
          height: 118px;
        }
        .rb-second .rb-avatar-wrap,
        .rb-third .rb-avatar-wrap {
          width: 92px;
          height: 92px;
        }
        .rb-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid #f5b91d;
          background: #222;
        }
        .rb-avatar-text {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          background: linear-gradient(135deg, #342060, #17104b);
        }
        .rb-second .rb-avatar { border-color: #72d8ff; }
        .rb-third .rb-avatar  { border-color: #ff789d; }

        .rb-crown {
          position: absolute;
          top: -34px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 38px;
        }
        .rb-rank {
          position: absolute;
          bottom: -13px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f6b91f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          color: #000;
        }
        .rb-second .rb-rank { background: #38bdf8; }
        .rb-third .rb-rank  { background: #ef5688; }

        .rb-pillar {
          margin-top: -2px;
          padding-top: 35px;
          border-radius: 18px 18px 0 0;
          height: 160px;
          background: linear-gradient(180deg, #efb72d, #a86d14);
        }
        .rb-second .rb-pillar {
          height: 120px;
          background: linear-gradient(180deg, #7169dc, #403a9b);
        }
        .rb-third .rb-pillar {
          height: 120px;
          background: linear-gradient(180deg, #d65b9b, #773e86);
        }
        .rb-name {
          font-size: 15px;
          font-weight: bold;
          margin-top: 8px;
        }
        .rb-diamonds {
          margin-top: 8px;
          font-size: 14px;
          font-weight: bold;
        }
        .rb-diamond {
          color: #31d8ff;
          margin-right: 4px;
        }

        /* ===== RANK LIST ===== */
        .rb-rank-list {
          background: #fff;
          color: #242b70;
          border-radius: 28px 28px 0 0;
          padding: 12px 15px 20px;
          margin-top: -2px;
          position: relative;
          z-index: 5;
        }
        .rb-row {
          min-height: 66px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e8e8f5;
          gap: 12px;
        }
        .rb-row:last-child { border-bottom: 0; }
        .rb-row.highlight {
          background: #f0efff;
          border-radius: 22px;
          margin: 4px 0;
          padding: 0 12px;
        }
        .rb-position {
          width: 25px;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
        }
        .rb-small-avatar {
          width: 43px;
          height: 43px;
          border-radius: 50%;
          object-fit: cover;
        }
        .rb-small-avatar-text {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: #ecebff;
        }
        .rb-state {
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: #c6c2f4;
          text-align: center;
          font-size: 14px;
        }
        .rb-user-name {
          flex: 1;
          font-size: 16px;
        }
        .rb-user-diamond {
          font-size: 15px;
          font-weight: bold;
        }
        .rb-user-diamond span { color: #28cfff; }

        /* ===== MOBILE ===== */
        @media (max-width: 380px) {
          .rb-header-text h1 { font-size: 24px; }
          .rb-title h2 { font-size: 24px; }
          .rb-first .rb-avatar-wrap { width: 100px; height: 100px; }
          .rb-second .rb-avatar-wrap,
          .rb-third .rb-avatar-wrap { width: 78px; height: 78px; }
          .rb-podium { height: 310px; }
        }
      `}</style>
    </div>
  );
}