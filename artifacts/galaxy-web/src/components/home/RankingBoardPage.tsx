// RankingBoardPage.tsx
import React, { useState, useMemo, useEffect } from "react";

/* =========================================================
   TYPES
========================================================= */

type TabType = "Global" | "Friends" | "Weekly" | "Monthly";

interface PodiumUser {
  rank: 1 | 2 | 3;
  name: string;
  diamonds: string;
  avatarId: number;
  crown: string;
}

interface RankUser {
  rank: string;
  name: string;
  diamonds: string;
  avatarId: number;
}

interface Props {
  onBack?: () => void;
}

/* =========================================================
   DATA
========================================================= */

const PODIUM_DATA: Record<TabType, PodiumUser[]> = {
  Global: [
    { rank: 1, name: "SHAMEER", diamonds: "125.6K", avatarId: 12, crown: "♛" },
    { rank: 2, name: "RoyalGirl", diamonds: "88.4K", avatarId: 47, crown: "♔" },
    { rank: 3, name: "Noor", diamonds: "76.2K", avatarId: 32, crown: "♔" },
  ],
  Friends: [
    { rank: 1, name: "BestFriend", diamonds: "94.2K", avatarId: 5, crown: "♛" },
    { rank: 2, name: "Rahul", diamonds: "78.4K", avatarId: 7, crown: "♔" },
    { rank: 3, name: "Anjali", diamonds: "65.8K", avatarId: 25, crown: "♔" },
  ],
  Weekly: [
    { rank: 1, name: "StarBoy", diamonds: "48.5K", avatarId: 11, crown: "♛" },
    { rank: 2, name: "Noor", diamonds: "41.2K", avatarId: 32, crown: "♔" },
    { rank: 3, name: "Devil", diamonds: "36.8K", avatarId: 14, crown: "♔" },
  ],
  Monthly: [
    { rank: 1, name: "QueenRiya", diamonds: "189.2K", avatarId: 44, crown: "♛" },
    { rank: 2, name: "StarBoy", diamonds: "168.6K", avatarId: 11, crown: "♔" },
    { rank: 3, name: "Ayaan", diamonds: "149.4K", avatarId: 68, crown: "♔" },
  ],
};

const LIST_DATA: Record<TabType, RankUser[]> = {
  Global: [
    { rank: "4", name: "StarBoy", diamonds: "64.8K", avatarId: 11 },
    { rank: "5", name: "QueenRiya", diamonds: "52.3K", avatarId: 44 },
    { rank: "6", name: "Devil", diamonds: "48.6K", avatarId: 14 },
    { rank: "7", name: "Ayaan", diamonds: "42.1K", avatarId: 68 },
    { rank: "8", name: "Zara", diamonds: "38.7K", avatarId: 15 },
  ],
  Friends: [
    { rank: "4", name: "BestFriend", diamonds: "54.5K", avatarId: 5 },
    { rank: "5", name: "Rahul", diamonds: "48.2K", avatarId: 7 },
    { rank: "6", name: "Anjali", diamonds: "43.8K", avatarId: 25 },
    { rank: "7", name: "Vicky", diamonds: "39.4K", avatarId: 18 },
    { rank: "8", name: "Sana", diamonds: "35.1K", avatarId: 29 },
  ],
  Weekly: [
    { rank: "4", name: "StarBoy", diamonds: "31.8K", avatarId: 11 },
    { rank: "5", name: "Noor", diamonds: "28.7K", avatarId: 32 },
    { rank: "6", name: "Devil", diamonds: "25.4K", avatarId: 14 },
    { rank: "7", name: "Ayaan", diamonds: "22.8K", avatarId: 68 },
    { rank: "8", name: "Zara", diamonds: "19.5K", avatarId: 15 },
  ],
  Monthly: [
    { rank: "4", name: "QueenRiya", diamonds: "89.2K", avatarId: 44 },
    { rank: "5", name: "StarBoy", diamonds: "78.6K", avatarId: 11 },
    { rank: "6", name: "Ayaan", diamonds: "69.4K", avatarId: 68 },
    { rank: "7", name: "Devil", diamonds: "61.2K", avatarId: 14 },
    { rank: "8", name: "Zara", diamonds: "57.8K", avatarId: 15 },
  ],
};

const TABS: TabType[] = ["Global", "Friends", "Weekly", "Monthly"];

/* =========================================================
   COMPONENT
========================================================= */

export default function RankingBoardPage({ onBack }: Props) {
  const [tab, setTab] = useState<TabType>("Global");

  const podium = PODIUM_DATA[tab];
  const list = LIST_DATA[tab];

  /* Extract podium order: 1st, 2nd, 3rd */
  const first = useMemo(() => podium.find((p) => p.rank === 1)!, [podium]);
  const second = useMemo(() => podium.find((p) => p.rank === 2)!, [podium]);
  const third = useMemo(() => podium.find((p) => p.rank === 3)!, [podium]);

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

        {/* PODIUM */}
        <div className="rb-podium">
          {/* 2nd Place */}
          <div className="rb-person rb-second">
            <div className="rb-avatar-wrap">
              <div className="rb-crown">{second.crown}</div>
              <img
                className="rb-avatar"
                src={`https://i.pravatar.cc/200?img=${second.avatarId}`}
                alt={second.name}
              />
              <div className="rb-rank">2</div>
            </div>
            <div className="rb-pillar">
              <div className="rb-name">{second.name}</div>
              <div className="rb-diamonds">
                <span className="rb-diamond">💎</span>
                {second.diamonds}
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="rb-person rb-first">
            <div className="rb-avatar-wrap">
              <div className="rb-crown">{first.crown}</div>
              <img
                className="rb-avatar"
                src={`https://i.pravatar.cc/200?img=${first.avatarId}`}
                alt={first.name}
              />
              <div className="rb-rank">1</div>
            </div>
            <div className="rb-pillar">
              <div className="rb-name">{first.name}</div>
              <div className="rb-diamonds">
                <span className="rb-diamond">💎</span>
                {first.diamonds}
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="rb-person rb-third">
            <div className="rb-avatar-wrap">
              <div className="rb-crown">{third.crown}</div>
              <img
                className="rb-avatar"
                src={`https://i.pravatar.cc/200?img=${third.avatarId}`}
                alt={third.name}
              />
              <div className="rb-rank">3</div>
            </div>
            <div className="rb-pillar">
              <div className="rb-name">{third.name}</div>
              <div className="rb-diamonds">
                <span className="rb-diamond">💎</span>
                {third.diamonds}
              </div>
            </div>
          </div>
        </div>

        {/* RANK LIST */}
        <div className="rb-rank-list">
          {list.map((user, index) => (
            <div
              key={user.rank}
              className={`rb-row ${index === 0 ? "highlight" : ""}`}
            >
              <div className="rb-position">{user.rank}</div>
              <img
                className="rb-small-avatar"
                src={`https://i.pravatar.cc/100?img=${user.avatarId}`}
                alt={user.name}
              />
              <div className="rb-user-name">{user.name}</div>
              <div className="rb-user-diamond">
                <span>💎</span> {user.diamonds}
              </div>
            </div>
          ))}
        </div>
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