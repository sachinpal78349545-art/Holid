// BottomBar.tsx
import React, { useState, useRef, useEffect } from "react";
import { Room, UserProfile } from "./types";
import { Mic, MicOff, Gift, Grip, Send, Smile, MessageCircle, Volume2, VolumeX, X } from "lucide-react";
import GiftPanel from "../gifts/GiftPanel";
import { LiveGift } from "../gifts/giftTypes";
import GameHub from "./GameHub";

const EMOJIS = ["❤️", "🔥", "✨", "😂", "🎵", "👏", "🌟", "💯", "🚀", "😍", "🎉", "💎"];

interface BottomBarProps {
  room: Room;
  user: UserProfile;
  inputText: string;
  setInputText: (v: string) => void;
  isMuted: boolean;
  isSpeakerOff: boolean;
  isOnSeat: boolean;
  onSendChat: () => void;
  onSendEmoji: (emoji: string) => void;
  onHandleGift: (gift: any, combo: number) => void;
  onHandleReaction: (emoji: string) => void;
  onMicToggle: () => void;
  onSpeakerToggle: () => void;
  onRaiseHand: () => void;
  onShare: () => void;
  showToast: (msg: string, type?: string, icon?: string) => void;
  onOpenMenu?: () => void;
  onOpenInbox?: () => void;
  inboxBadge?: number;
  onFloatEmoji?: (emoji: string) => void;
  className?: string;
  hasControl?: boolean;
  onSelectGame?: (game: string) => void;
  onCloseMenu?: () => void;
}

export default function BottomBar({
  user, inputText, setInputText, isMuted, isSpeakerOff, isOnSeat,
  onSendChat, onSendEmoji, onHandleGift, onMicToggle, onSpeakerToggle,
  showToast, hasControl = false, onSelectGame, onCloseMenu,
}: BottomBarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = () => {
      if (window.visualViewport) {
        const d = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(d > 100 ? d : 0);
      }
    };
    window.visualViewport?.addEventListener("resize", h);
    return () => window.visualViewport?.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (inputOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [inputOpen]);

  const closeAll = () => { setShowEmoji(false); setShowGift(false); setShowMenu(false); };
  const micActive = isOnSeat && !isMuted;
  const speakerActive = !isSpeakerOff;

  return (
    <>
      {/* BACKDROP */}
      {(showGift || showEmoji || showMenu) && (
        <div onClick={closeAll} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.18)" }} />
      )}

      {/* CHAT INPUT */}
      {(inputOpen || keyboardHeight > 0) && (
        <div style={{
          position: "fixed", left: 12, right: 12,
          bottom: keyboardHeight > 0 ? keyboardHeight + 72 : 82,
          maxWidth: 456, margin: "0 auto", zIndex: 1200,
          display: "flex", alignItems: "center", gap: 8,
          background: "#14283eeb",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 24, padding: "5px 5px 5px 14px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}>
          <input
            ref={inputRef}
            placeholder="Say something…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            type="search"
            autoComplete="off"
            name="room-chat-message"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (inputText.trim()) onSendChat();
                setInputOpen(false);
              }
            }}
            style={{
              flex: 1, minWidth: 0, background: "none", border: "none",
              outline: "none", color: "#fff", fontSize: 14,
            }}
          />
          <button
            onClick={() => { if (inputText.trim()) onSendChat(); setInputOpen(false); }}
            style={{
              width: 36, height: 36, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* MAIN BAR */}
      <div style={{
        position: "fixed", bottom: keyboardHeight, left: 0, right: 0,
        maxWidth: 480, margin: "0 auto", zIndex: 1000,
        padding: keyboardHeight > 0 ? "8px 12px 10px" : "12px 14px 20px",
        transition: "bottom 0.1s ease-out",
      }}>
        {keyboardHeight === 0 && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 7,
          }}>
            {/* SPEAKER */}
            <button onClick={onSpeakerToggle} style={toolStyle}>
              {speakerActive ? <Volume2 size={22} strokeWidth={2} color="#fff" /> : <VolumeX size={22} strokeWidth={2} color="#fff" />}
            </button>

            {/* MIC */}
            <button onClick={onMicToggle} style={toolStyle}>
              {micActive ? (
                <Mic size={22} strokeWidth={2} color="#d9a6ff" style={{ filter: "drop-shadow(0 0 5px rgba(190,100,255,0.55))" }} />
              ) : (
                <MicOff size={22} strokeWidth={2} color="#fff" />
              )}
            </button>

            {/* EMOJI */}
            <button onClick={() => { setShowEmoji(!showEmoji); setShowGift(false); setShowMenu(false); setInputOpen(false); }} style={toolStyle}>
              <Smile size={22} strokeWidth={1.8} color={showEmoji ? "#d9a6ff" : "#fff"} />
            </button>

            {/* CHAT */}
            <button onClick={() => { setInputOpen(!inputOpen); setShowEmoji(false); setShowGift(false); setShowMenu(false); }} style={toolStyle}>
              <MessageCircle size={22} strokeWidth={1.8} color={inputOpen ? "#d9a6ff" : "#fff"} />
            </button>

            {/* MENU */}
            <button onClick={() => { setShowMenu(!showMenu); setShowEmoji(false); setShowGift(false); setInputOpen(false); }} style={toolStyle}>
              <Grip size={22} strokeWidth={2} color={showMenu ? "#d9a6ff" : "#fff"} />
            </button>

            {/* GIFT */}
            <button
              onClick={() => { setShowGift(!showGift); setShowEmoji(false); setShowMenu(false); setInputOpen(false); }}
              style={{ ...toolStyle, background: "#b52b66a8", borderColor: "#ffffff70" }}
            >
              <Gift size={23} strokeWidth={1.8} color="#fff" />
            </button>
          </div>
        )}
      </div>

      {/* EMOJI POPUP */}
      {keyboardHeight === 0 && showEmoji && (
        <div style={{
          position: "fixed", bottom: 86, left: "50%", transform: "translateX(-50%)",
          width: 250, maxWidth: "calc(100vw - 30px)", zIndex: 1100,
          background: "#14283efb", backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 18, padding: 12,
          boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => { onSendEmoji(e); closeAll(); }} style={{
                width: 42, height: 42, background: "rgba(255,255,255,0.08)",
                border: "none", borderRadius: 12, cursor: "pointer", fontSize: 25,
              }}>{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* GIFT PANEL */}
      {keyboardHeight === 0 && showGift && (
        <GiftPanel
          userCoins={user.coins}
          onSendGift={(gift: LiveGift, combo: number) =>
            onHandleGift({
              emoji: gift.emoji, name: gift.name, cost: gift.cost,
              url: gift.url, animationType: gift.animationType, soundUrl: gift.soundUrl,
            }, combo)
          }
          onClose={closeAll}
        />
      )}

      {/* GAME HUB */}
      {keyboardHeight === 0 && showMenu && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100,
          maxHeight: "70vh",
          background: "#14283efb", backdropFilter: "blur(20px)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderTop: "1px solid rgba(255,255,255,0.2)",
          padding: "20px 16px 30px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
          overflowY: "auto",
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 16px" }} />
          <button
            onClick={() => { setShowMenu(false); onCloseMenu?.(); }}
            style={{
              position: "absolute", top: 12, right: 16,
              background: "none", border: "none", color: "rgba(255,255,255,0.5)",
              cursor: "pointer", width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          ><X size={20} /></button>
          <GameHub
            hasControl={hasControl}
            onSelectGame={(g) => { setShowMenu(false); onSelectGame?.(g); }}
            onClose={() => { setShowMenu(false); onCloseMenu?.(); }}
          />
        </div>
      )}
    </>
  );
}

const toolStyle: React.CSSProperties = {
  width: 46, height: 46, borderRadius: "50%",
  border: "1px solid #ffffff70",
  background: "#ffffff32",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", padding: 0, flexShrink: 0,
};