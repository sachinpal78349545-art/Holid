// RoomHeader.tsx
import React from "react";
import { Wallet, Share2, Power, Trophy, Users } from "lucide-react";
import { Room } from "./types";

interface RoomHeaderProps {
  room: Room;
  myRole: "owner" | "admin" | "user";
  liveCount: number;
  elapsed: string;
  hasControl: boolean;
  onOpenControlPanel: () => void;
  onShowUsersPanel: () => void;
  onShowCloseMenu: () => void;
  onLoadLeaderboard: () => void;
  onShare: () => void;
  onShowMoreMenu?: () => void;
}

export default function RoomHeader({
  room,
  liveCount,
  onShowCloseMenu,
  onShare,
  onShowMoreMenu,
  onOpenControlPanel,
  onShowUsersPanel, // ✅ YEH ADD KIYA
}: RoomHeaderProps) {
  const previewUsers = Object.values(room.roomUsers || {}).slice(0, 1);
  const avatarEmoji = room.coverEmoji || "🎵";
  const avatarSrc = room.roomAvatar || "";
  const isValid = (u: string) => u.startsWith("http") || u.startsWith("/");

  return (
    <div style={{ position: "absolute", zIndex: 2, top: 18, left: 14, right: 14 }}>

      {/* ROOM INFO PILL (Top Left) */}
      <div
        onClick={onOpenControlPanel}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#14283e9e", border: "1px solid #ffffff25",
          borderRadius: 28, padding: "8px 12px", width: "58%",
          backdropFilter: "blur(10px)", cursor: "pointer",
        }}
      >
        <div style={{
          width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
          border: "2px solid #ffffff55", overflow: "hidden",
          background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {isValid(avatarSrc) ? (
            <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : avatarEmoji}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {room.name}
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
            ID: {room.id.slice(5, 14).toUpperCase()}
          </div>
        </div>
      </div>

      {/* TOP ACTIONS (Top Right) */}
      <div style={{
        position: "absolute", right: 2, top: 18,
        display: "flex", gap: 20, alignItems: "center",
      }}>
        <Wallet size={24} strokeWidth={2} style={{ cursor: "pointer" }} />
        <Share2 size={24} strokeWidth={2} style={{ cursor: "pointer" }} onClick={onShare} />
        <Power
          size={24} strokeWidth={2}
          style={{ cursor: "pointer", color: "#ff7a7a" }}
          onClick={onShowCloseMenu}
        />
      </div>

      {/* TROPHY BAR */}
      <div style={{
        marginTop: 10,
        background: "#172b40a8",
        borderRadius: "0 30px 30px 0",
        padding: "10px 14px",
        width: 155,
        fontSize: 18,
        color: "#ffe64d",
        fontWeight: "bold",
        display: "flex", alignItems: "center", gap: 6,
        backdropFilter: "blur(8px)",
        cursor: "pointer",
      }}>
        <Trophy size={18} strokeWidth={2.2} />
        {(liveCount * 0.95 + 7.23).toFixed(2)}K
      </div>

      {/* PEOPLE PILL */}
      <div
        onClick={onShowUsersPanel}
        style={{
          position: "absolute", right: 5, top: 88,
          display: "flex", alignItems: "center", gap: 8,
          background: "#ffffff20", padding: "5px 10px",
          borderRadius: 30, backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
      >
        {previewUsers.length > 0 && isValid(previewUsers[0].avatar) ? (
          <img
            src={previewUsers[0].avatar}
            alt=""
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#4c1d95", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Users size={16} />
          </div>
        )}
        <span style={{ fontSize: 16, fontWeight: "bold" }}>{liveCount}</span>
      </div>
    </div>
  );
}