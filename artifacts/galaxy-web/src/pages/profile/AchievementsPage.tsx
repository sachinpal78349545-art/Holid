import { useMemo } from "react";
import { Achievement, UserProfile, getAchievementsList } from "../../lib/userService";

interface Props {
  user: UserProfile;
  onClose: () => void;
}

function FullscreenSheet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "linear-gradient(160deg, #0d001a 0%, #1a0030 100%)",
      zIndex: 1100, display: "flex", flexDirection: "column", fontFamily: "'Poppins', 'Inter', sans-serif",
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 48px" }}>{children}</div>
    </div>
  );
}

export default function AchievementsPage({ user, onClose }: Props) {
  const achievements = useMemo(() => getAchievementsList(user), [user]);
  const unlockedCount = achievements.filter(achievement => achievement.unlocked).length;

  return (
    <FullscreenSheet>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>🏆 Achievements ({unlockedCount}/{achievements.length})</h2>
        <button onClick={onClose} aria-label="Close achievements" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "rgba(162,155,254,0.5)" }}>✕</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {achievements.map((achievement: Achievement) => (
          <div key={achievement.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            background: achievement.unlocked ? "rgba(108,92,231,0.1)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${achievement.unlocked ? "rgba(108,92,231,0.3)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 14, opacity: achievement.unlocked ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 28, filter: achievement.unlocked ? "none" : "grayscale(1)" }}>{achievement.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: achievement.unlocked ? "#fff" : "rgba(255,255,255,0.5)" }}>{achievement.title}</p>
              <p style={{ fontSize: 11, color: "rgba(162,155,254,0.4)" }}>{achievement.description}</p>
            </div>
            {achievement.unlocked && <span style={{ fontSize: 20 }}>✅</span>}
          </div>
        ))}
      </div>
    </FullscreenSheet>
  );
}