// ChatSection.tsx
import React, { useEffect, useState } from "react";
import { RoomMessage, cleanName } from "./types";

interface ChatSectionProps {
  messages: RoomMessage[];
  userId: string;
  msgEndRef: React.RefObject<HTMLDivElement>;
  onUserClick?: (userId: string, username: string, avatar: string) => void;
  onClapClick?: (msg: RoomMessage) => void;
}

export default function ChatSection({
  messages, userId: _userId, msgEndRef,
  onUserClick = () => {}, onClapClick = () => {},
}: ChatSectionProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handle = () => {
      if (window.visualViewport) {
        const d = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(d > 150 ? d : 0);
      }
    };
    window.visualViewport?.addEventListener("resize", handle);
    return () => window.visualViewport?.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, keyboardHeight]);

  return (
    <div style={{
      position: "absolute", zIndex: 2,
      left: 14, right: 14, top: "55%", bottom: 86,
      display: "flex", flexDirection: "column", gap: 10,
      minHeight: 0,
      transform: `translateY(-${keyboardHeight > 0 ? keyboardHeight - 20 : 0}px)`,
      transition: "transform 0.2s",
    }}>
      {/* NOTICE */}
      <div style={{
        background: "#1e46669c",
        color: "#ffe84b",
        padding: "12px 16px",
        borderRadius: "5px 5px 12px 12px",
        fontSize: 13,
        backdropFilter: "blur(6px)",
      }}>
        Welcome to Top Chat. Please respect each other and chat in a decent manner.
      </div>

      {/* MESSAGES SCROLL */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        overflowY: "auto", overscrollBehavior: "contain",
        flex: 1, padding: "2px 2px 10px",
        scrollbarWidth: "none",
        maskImage: "linear-gradient(to top, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, black 85%, transparent 100%)",
      }}>
        {messages.map((msg, i) => {
          const isEnterRoom = msg.type === "join" ||
            msg.text?.toLowerCase().includes("enter the room");
          const isWelcome = msg.type === "welcome" ||
            msg.text?.toLowerCase().includes("welcome to the room");

          // ENTER ROOM MESSAGE
          if (isEnterRoom) {
            return (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "center",
                maxWidth: "95%",
                background: "#3a1c3dba",
                backdropFilter: "blur(8px)",
                padding: "8px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div
                  onClick={() => onUserClick(msg.userId, msg.username, msg.avatar)}
                  style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }}
                >
                  <img
                    src={msg.avatar || "https://i.pravatar.cc/100"}
                    alt=""
                    style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ffe15a" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                    <span style={{ color: "#d946ef", fontWeight: "bold", fontSize: 13 }}>
                      {cleanName(msg.username)}
                    </span>
                    <span style={{ color: "#fff", fontSize: 12 }}>enter the room</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onClapClick(msg); }}
                  style={{
                    background: "transparent", border: "none",
                    fontSize: 22, cursor: "pointer", padding: "0 4px",
                    transition: "transform 0.1s",
                  }}
                >👏</button>
              </div>
            );
          }

          // WELCOME SYSTEM MESSAGE
          if (isWelcome) {
            const tId = (msg as any).targetUserId || msg.userId;
            const tName = (msg as any).targetUsername || msg.username;
            const tAvatar = (msg as any).targetAvatar || msg.avatar;
            return (
              <div
                key={i}
                onClick={() => onUserClick(tId, tName, tAvatar)}
                style={{
                  alignSelf: "flex-start", maxWidth: "92%",
                  padding: "12px 14px",
                  borderRadius: "5px 16px 16px 5px",
                  background: "#751db7f0",
                  borderLeft: "3px solid #ffce40",
                  fontSize: 13,
                  boxShadow: "0 2px 8px #0003",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#d946ef", fontWeight: "bold" }}>@{cleanName(tName)}</span>
                <span style={{ color: "#fff", marginLeft: 4 }}>{msg.text}</span>
              </div>
            );
          }

          // SYSTEM MESSAGE
          if (msg.type === "system" || msg.type === "leave") {
            return (
              <div key={i} style={{
                alignSelf: "flex-start",
                padding: "6px 10px",
                borderRadius: 10,
                background: "#1e46669c",
                color: "#ffe84b",
                fontSize: 12,
              }}>
                {msg.text}
              </div>
            );
          }

          // NORMAL CHAT MESSAGE
          return (
            <div key={i} style={{
              display: "flex", gap: 7, alignItems: "flex-start", maxWidth: "95%",
            }}>
              <img
                src={msg.avatar || "https://i.pravatar.cc/100"}
                alt=""
                onClick={() => onUserClick(msg.userId, msg.username, msg.avatar)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "1px solid #ffe15a", objectFit: "cover",
                  flexShrink: 0, cursor: "pointer",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  onClick={() => onUserClick(msg.userId, msg.username, msg.avatar)}
                  style={{
                    fontSize: 13, margin: "2px 0 5px",
                    textShadow: "0 1px 3px #000",
                    fontWeight: "bold", cursor: "pointer",
                  }}
                >
                  {cleanName(msg.username)}
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#8720cff2",
                  border: "1px solid #c982ff",
                  borderRadius: 3,
                  padding: "10px 14px",
                  fontSize: 14,
                  lineHeight: 1.35,
                  overflowWrap: "anywhere",
                  maxWidth: "100%",
                  boxShadow: "0 2px 5px #0003",
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </div>
    </div>
  );
}