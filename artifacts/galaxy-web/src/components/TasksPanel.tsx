// TasksPanel.tsx
import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, gainXP } from "../lib/userService";
import { ref, update } from "firebase/database";
import { db } from "../lib/firebase";
import { useToast } from "../lib/toastContext";

/* =========================================================
   TYPES
========================================================= */

interface TaskData {
  id: number;
  icon: string;
  name: string;
  description: string;
  current: number;
  total: number;
  reward: number;
  claimed: boolean;
}

interface TasksPanelProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate?: (updated: Partial<UserProfile>) => void;
}

/* =========================================================
   INITIAL TASK DATA
========================================================= */

const INITIAL_TASKS: TaskData[] = [
  {
    id: 1,
    icon: "💬",
    name: "Send 10 Messages",
    description: "Send messages in chat",
    current: 7,
    total: 10,
    reward: 10,
    claimed: false,
  },
  {
    id: 2,
    icon: "🎁",
    name: "Send 1 Gift",
    description: "Send a gift to any user",
    current: 0,
    total: 1,
    reward: 30,
    claimed: false,
  },
  {
    id: 3,
    icon: "👥",
    name: "Follow 5 Users",
    description: "Follow new users",
    current: 4,
    total: 5,
    reward: 20,
    claimed: false,
  },
  {
    id: 4,
    icon: "🎙️",
    name: "Join a Voice Room",
    description: "Stay in room for 5 minutes",
    current: 3,
    total: 5,
    reward: 25,
    claimed: false,
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TasksPanel({ user, onClose, onUpdate }: TasksPanelProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskData[]>(INITIAL_TASKS);
  const [balance, setBalance] = useState<number>(user.coins || 0);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);

  /* ---- Completed count ---- */
  const completedCount = useMemo(
    () => tasks.filter((t) => t.current >= t.total).length,
    [tasks]
  );

  /* ---- Lock body scroll when popup open ---- */
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPopup]);

  /* ---- Handle button click ---- */
  const handleTaskButton = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If task is complete → open claim popup
    if (task.current >= task.total) {
      if (!task.claimed) {
        setSelectedTaskId(taskId);
        setShowPopup(true);
      }
      return;
    }

    // Otherwise increment progress (demo)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, current: Math.min(t.current + 1, t.total) } : t
      )
    );
  };

  /* ---- Claim reward ---- */
  const handleClaimReward = async () => {
    if (selectedTaskId === null) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task || task.claimed) return;

    setClaiming(true);

    try {
      const newBalance = (user.coins || 0) + task.reward;

      // Update Firebase
      await update(ref(db, `users/${user.uid}`), {
        coins: newBalance,
      });

      // Update local state
      setBalance(newBalance);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTaskId ? { ...t, claimed: true } : t
        )
      );

      // Notify parent
      onUpdate?.({ coins: newBalance });

      // Gain XP bonus
      gainXP(user.uid, 5, user.xp, user.level).catch(console.error);

      showToast(`+${task.reward} 💎 Claimed!`, "success");

      setShowPopup(false);
      setSelectedTaskId(null);
    } catch (error) {
      console.error("Claim error:", error);
      showToast("Failed to claim reward", "error");
    } finally {
      setClaiming(false);
    }
  };

  /* ---- Close popup ---- */
  const closePopup = () => {
    if (claiming) return;
    setShowPopup(false);
    setSelectedTaskId(null);
  };

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="tc-page">
      {/* HEADER */}
      <header className="tc-header">
        <button
          className="tc-back"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ‹
        </button>

        <div className="tc-header-text">
          <h1>Task Center</h1>
          <p>Complete tasks, earn diamonds & rewards!</p>
        </div>

        <div className="tc-balance">
          💎 <b>{balance}</b>
        </div>
      </header>

      {/* CONTENT */}
      <main className="tc-content">
        <div className="tc-section-title">
          <h2>Today's Tasks</h2>
          <span>{completedCount}/4 completed</span>
        </div>

        {/* TASK LIST */}
        {tasks.map((task, index) => {
          const isComplete = task.current >= task.total;
          const percent = Math.min(100, (task.current / task.total) * 100);
          const isClaimed = task.claimed;

          let buttonText = "Go";
          let buttonClass = "tc-action";

          if (isClaimed) {
            buttonText = "✓ Claimed";
            buttonClass = "tc-action claimed";
          } else if (isComplete) {
            buttonText = "Claim";
            buttonClass = "tc-action claim";
          }

          return (
            <div
              key={task.id}
              className={`tc-task tc-task-${(index % 4) + 1}`}
            >
              <div className="tc-task-top">
                <div className="tc-task-icon">{task.icon}</div>
                <div className="tc-task-info">
                  <h3>{task.name}</h3>
                  <p>{task.description}</p>
                </div>
                <div className="tc-reward">💎 +{task.reward}</div>
              </div>

              <div className="tc-progress-row">
                <div className="tc-count">
                  {task.current}/{task.total}
                </div>
                <div className="tc-progress">
                  <div
                    className="tc-progress-bar"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <button
                className={buttonClass}
                onClick={() => handleTaskButton(task.id)}
                disabled={isClaimed}
                type="button"
              >
                {buttonText}
              </button>
            </div>
          );
        })}

        <div className="tc-info">
          💡 <b>Complete a task</b> to unlock its reward. After completion, tap{" "}
          <b>Claim</b> to collect your diamonds.
        </div>
      </main>

      {/* REWARD POPUP */}
      {showPopup && selectedTask && (
        <div
          className="tc-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePopup();
          }}
        >
          <div className="tc-popup">
            <div className="tc-close-row">
              <button
                className="tc-close"
                onClick={closePopup}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="tc-reward-icon">💎</div>

            <h2>Reward Unlocked!</h2>

            <div className="tc-popup-text">
              "{selectedTask.name}" completed! Your reward is ready to claim.
            </div>

            <div className="tc-reward-box">
              <div className="tc-reward-amount">💎 +{selectedTask.reward}</div>
              <small>Task Reward</small>
            </div>

            <button
              className="tc-claim-reward"
              onClick={handleClaimReward}
              disabled={claiming}
              type="button"
            >
              {claiming ? "Claiming..." : "Claim Reward"}
            </button>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .tc-page {
          position: fixed;
          inset: 0;
          z-index: 2000;
          min-height: 100dvh;
          background: #f8f7ff;
          color: #29234e;
          font-family: Arial, Helvetica, sans-serif;
          padding-bottom: 40px;
          overflow-y: auto;
          animation: tcPageIn 0.25s ease;
        }
        .tc-page * {
          box-sizing: border-box;
        }

        @keyframes tcPageIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        /* ===== HEADER ===== */
        .tc-header {
          height: 185px;
          padding: 25px 20px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
          background:
            radial-gradient(circle at 90% 20%, rgba(180,90,255,0.28), transparent 27%),
            linear-gradient(135deg, #281450, #382070, #1d183d);
          color: #fff;
        }
        .tc-back {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9140ff, #6e2bdd);
          color: white;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          cursor: pointer;
          line-height: 1;
        }
        .tc-header-text {
          position: absolute;
          left: 85px;
          top: 28px;
        }
        .tc-header-text h1 {
          font-size: 30px;
          font-weight: 800;
          margin: 0;
        }
        .tc-header-text p {
          margin-top: 6px;
          color: #d9d1ec;
          font-size: 14px;
          line-height: 1.35;
        }
        .tc-balance {
          position: absolute;
          right: 18px;
          top: 27px;
          padding: 8px 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 13px;
        }
        .tc-balance b { color: #77d9ff; }

        /* ===== CONTENT ===== */
        .tc-content { padding: 20px 16px 40px; }
        .tc-section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 4px 13px;
        }
        .tc-section-title h2 { font-size: 22px; margin: 0; }
        .tc-section-title span { font-size: 12px; color: #8d86a5; }

        /* ===== TASK CARD ===== */
        .tc-task {
          background: #fff;
          border: 1px solid #e9e5f5;
          border-radius: 22px;
          padding: 13px;
          margin-bottom: 12px;
          box-shadow: 0 5px 15px rgba(55,35,110,0.055);
        }
        .tc-task-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .tc-task-icon {
          width: 55px;
          height: 55px;
          flex: none;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 29px;
          background: #eee5ff;
        }
        .tc-task-2 .tc-task-icon { background: #e1f1ff; }
        .tc-task-3 .tc-task-icon { background: #ffe5ef; }
        .tc-task-4 .tc-task-icon { background: #e1f8ec; }

        .tc-task-info { flex: 1; min-width: 0; }
        .tc-task-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tc-task-info p {
          margin-top: 4px;
          font-size: 11px;
          color: #8b84a4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tc-reward {
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: #30275a;
          white-space: nowrap;
        }

        /* ===== PROGRESS ===== */
        .tc-progress-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 9px;
        }
        .tc-count {
          width: 35px;
          flex: none;
          font-size: 11px;
          color: #716a89;
          font-weight: 600;
        }
        .tc-progress {
          height: 6px;
          flex: 1;
          background: #e9e5f4;
          border-radius: 20px;
          overflow: hidden;
        }
        .tc-progress-bar {
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(90deg, #7931ed, #a343ff);
          transition: width 0.3s ease;
        }

        /* ===== BUTTON ===== */
        .tc-action {
          width: 100%;
          height: 37px;
          margin-top: 10px;
          border-radius: 15px;
          background: linear-gradient(135deg, #7731ed, #a241f5);
          color: white;
          font-size: 13px;
          font-weight: 700;
          border: 0;
          cursor: pointer;
          box-shadow: 0 5px 12px rgba(119,49,237,0.18);
          transition: transform 0.15s ease;
          font-family: inherit;
        }
        .tc-action:active { transform: scale(0.97); }

        .tc-action.claim {
          background: linear-gradient(135deg, #ff9d28, #ff617d);
          box-shadow: 0 5px 13px rgba(255,100,100,0.2);
          animation: tcClaimPulse 1.5s infinite;
        }
        @keyframes tcClaimPulse {
          0%, 100% { box-shadow: 0 5px 13px rgba(255,100,100,0.18); }
          50%      { box-shadow: 0 5px 19px rgba(255,100,100,0.38); }
        }

        .tc-action.claimed {
          background: #eceaf3;
          color: #77718d;
          box-shadow: none;
          cursor: default;
        }

        /* ===== INFO ===== */
        .tc-info {
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 18px;
          background: #eee9ff;
          color: #70688b;
          font-size: 11px;
          line-height: 1.45;
        }
        .tc-info b { color: #682dd1; }

        /* ===== POPUP ===== */
        .tc-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(24,14,49,0.62);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          animation: tcFadeIn 0.2s ease;
        }
        @keyframes tcFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .tc-popup {
          width: 100%;
          max-width: 370px;
          padding: 20px;
          border-radius: 28px;
          background: #fff;
          text-align: center;
          box-shadow: 0 25px 70px rgba(20,10,60,0.35);
          animation: tcPopupIn 0.25s ease;
        }
        @keyframes tcPopupIn {
          from { opacity: 0; transform: translateY(25px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tc-close-row { display: flex; justify-content: flex-end; }
        .tc-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #f0edf7;
          color: #6d6681;
          font-size: 20px;
          border: 0;
          cursor: pointer;
        }
        .tc-reward-icon {
          width: 105px;
          height: 105px;
          margin: 2px auto 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          background: radial-gradient(circle, #fff 0 45%, #eee4ff 46% 100%);
          border: 6px solid #9a50f4;
          box-shadow:
            0 0 0 8px rgba(150,75,240,0.08),
            0 10px 25px rgba(120,50,230,0.18);
        }
        .tc-popup h2 {
          font-size: 25px;
          color: #2d2550;
          margin: 0;
        }
        .tc-popup-text {
          margin: 8px 10px 17px;
          font-size: 13px;
          line-height: 1.45;
          color: #837b9d;
        }
        .tc-reward-box {
          padding: 14px;
          border-radius: 19px;
          background: #f2ecff;
          border: 1px solid #dfd2ff;
        }
        .tc-reward-amount {
          font-size: 27px;
          font-weight: 900;
          color: #302457;
        }
        .tc-reward-box small { color: #837a9f; font-size: 11px; }

        .tc-claim-reward {
          width: 100%;
          height: 48px;
          margin-top: 14px;
          border-radius: 17px;
          color: white;
          font-size: 16px;
          font-weight: 800;
          border: 0;
          cursor: pointer;
          background: linear-gradient(135deg, #7430ed, #a542f5);
          box-shadow: 0 8px 20px rgba(116,48,237,0.25);
          transition: transform 0.15s ease;
          font-family: inherit;
        }
        .tc-claim-reward:active { transform: scale(0.97); }
        .tc-claim-reward:disabled {
          opacity: 0.6;
          cursor: default;
        }

        /* ===== MOBILE ===== */
        @media (max-width: 360px) {
          .tc-task { padding: 11px; }
          .tc-task-icon { width: 51px; height: 51px; font-size: 27px; }
          .tc-task-info h3 { font-size: 14px; }
          .tc-reward { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}