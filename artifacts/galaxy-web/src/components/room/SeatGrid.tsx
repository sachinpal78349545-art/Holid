// SeatGrid.tsx
import React from "react";
import { Room, RoomSeat, cleanName } from "./types";
import { getUserRole } from "../../lib/roomService";
import AvatarFrame from "../frames/AvatarFrame";
import { Mic } from "lucide-react";

interface SeatGridProps {
  room: Room;
  userUid: string;
  hasControl: boolean;
  speakingUids: Set<number>;
  voiceJoined: boolean;
  hashCode: (s: string) => number;
  onSeatTap: (seatIndex: number, seat: RoomSeat) => void;
  isOwnerSeat?: (seat: RoomSeat) => boolean;
  officialUids?: Set<string>;
  superAdminUids?: Set<string>;
  equippedFrames?: Record<string, string>;
  ghostUids?: Set<string>;
}

export default function SeatGrid({
  room, userUid, speakingUids, voiceJoined, hashCode, onSeatTap,
  isOwnerSeat, officialUids, equippedFrames, ghostUids,
}: SeatGridProps) {
  return (
    <div style={{
      position: "absolute", zIndex: 2,
      top: "26%", left: 10, right: 10,
      display: "grid",
      gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
      columnGap: 6, rowGap: 28,
    }}>
      {Array.from({ length: 10 }, (_, i) => {
        const lockedByDefault = i === 9;
        const seat: RoomSeat = room.seats[i] || {
          index: i, userId: null, username: null, avatar: null,
          isMuted: false, isLocked: lockedByDefault, isSpeaking: false,
        };

        const isSpeaking = seat.userId
          ? voiceJoined
            ? speakingUids.has(Math.abs(hashCode(seat.userId)) % 1000000)
            : speakingUids.has(i)
          : false;

        const frameId = seat.userId && equippedFrames ? equippedFrames[seat.userId] : undefined;
        const isGhost = seat.userId ? ghostUids?.has(seat.userId) || false : false;
        const isGhostMe = isGhost && seat.userId === userUid;

        const display = isGhost && !isGhostMe
          ? { ...seat, userId: null, username: null, avatar: null }
          : seat;

        const occupied = !!display.userId;
        const role = display.userId ? getUserRole(room, display.userId) : "user";
        const isOfficial = display.userId ? officialUids?.has(display.userId) || false : false;
        const hasFrame = !!frameId && occupied;

        const clickable = display.userId === userUid
          || (!display.userId && !display.isLocked);

        return (
          <div
            key={i}
            onClick={() => clickable && onSeatTap(i, seat)}
            style={{
              opacity: isGhost ? (isGhostMe ? 0.4 : 0) : 1,
              transition: "opacity 0.3s",
              textAlign: "center", cursor: clickable ? "pointer" : "default",
              userSelect: "none", minWidth: 0, position: "relative",
            }}
          >
            {/* SEAT CIRCLE */}
            <div
              className={occupied ? "seat-circle-occupied" : ""}
              style={{
                width: "min(18vw, 70px)",
                height: "min(18vw, 70px)",
                maxWidth: 70, maxHeight: 70,
                margin: "auto",
                borderRadius: "50%",
                background: occupied ? "transparent" : "#dcecff38",
                border: occupied
                  ? "3px solid #ffd53c"
                  : display.isLocked
                    ? "1px solid #ffffff33"
                    : "1px solid #ffffff33",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: occupied
                  ? "0 0 12px rgba(255, 213, 60, 0.4)"
                  : isSpeaking
                    ? "inset 0 0 15px #ffffff12, 0 0 12px rgba(255,255,255,0.4)"
                    : "inset 0 0 15px #ffffff12",
                fontSize: 31, color: "#f6fbff",
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {hasFrame ? (
                <AvatarFrame avatar={display.avatar || "👤"} frameId={frameId} size={64} />
              ) : occupied ? (
                display.avatar && (display.avatar.startsWith("http") || display.avatar.startsWith("/")) ? (
                  <img
                    src={display.avatar}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = "none";
                      if (t.parentElement) t.parentElement.textContent = "👤";
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 24 }}>👤</span>
                )
              ) : (
                <Mic size={28} strokeWidth={2} color="#f6fbff" />
              )}

              {/* LOCK ICON */}
              {display.isLocked && !occupied && (
                <span style={{
                  position: "absolute", fontSize: 14,
                  bottom: 4, right: 4,
                }}>🔒</span>
              )}

              {/* MUTE INDICATOR */}
              {occupied && display.isMuted && (
                <span style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#dc2626", fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>🔇</span>
              )}
            </div>

            {/* SEAT NAME */}
            <div style={{
              fontSize: 12,
              fontWeight: "bold",
              marginTop: 6,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: "0 2px 4px #000",
              color: "#fff",
            }}>
              {occupied && display.username
                ? cleanName(display.username)
                : `No.${i + 1}`}
            </div>

            {/* ROLE BADGE (small) */}
            {occupied && role === "owner" && (
              <span style={{ fontSize: 10 }}>👑</span>
            )}
            {occupied && role === "admin" && !isOfficial && (
              <span style={{ fontSize: 10 }}>🛡️</span>
            )}
          </div>
        );
      })}
    </div>
  );
}