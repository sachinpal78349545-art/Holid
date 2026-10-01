// UserProfileSheet.tsx
import React, { useState } from "react";
import {
  X,
  Share2,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  MessageCircle,
  Gift,
  LogOut,
  Mic,
  MicOff,
  DoorOpen,
  ShieldCheck,
  Crown,
  ChevronRight,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  avatar: string;
  seat: number;
  muted: boolean;
  occupied: boolean;
}

interface Props {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: "owner" | "admin" | "user";
  onFollowToggle: (userId: string) => void;
  isFollowing: boolean;
  onChat: (userId: string) => void;
  onGift: (userId: string) => void;
  onLeave: (seat: number) => void;
  onKick: (seat: number) => void;
  onMuteToggle: (seat: number) => void;
  onMakeAdmin: (seat: number) => void;
  onInvite: (seat: number) => void;
}

export default function UserProfileSheet({
  user,
  isOpen,
  onClose,
  currentUserRole,
  onFollowToggle,
  isFollowing,
  onChat,
  onGift,
  onLeave,
  onKick,
  onMuteToggle,
  onMakeAdmin,
  onInvite,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<"leave" | "kick" | null>(null);

  if (!isOpen || !user) return null;

  const isOccupied = user.occupied;

  const handleConfirm = () => {
    if (confirmType === "leave") onLeave(user.seat);
    if (confirmType === "kick") onKick(user.seat);
    setShowConfirm(false);
    onClose(); // Close sheet after action
  };

  const triggerConfirm = (type: "leave" | "kick") => {
    setConfirmType(type);
    setShowConfirm(true);
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* BOTTOM SHEET */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] flex max-h-[85vh] w-full flex-col rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out overflow-y-auto">
        
        {/* HANDLE */}
        <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />

        {/* PROFILE AREA */}
        <div className="text-center relative flex flex-col items-center">
          {isOccupied ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-[105px] w-[105px] rounded-full border-4 border-white object-cover shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            />
          ) : (
            <div className="flex h-[105px] w-[105px] items-center justify-center rounded-full bg-[#f0eef3] text-[#aaa5af]">
              <Mic size={42} />
            </div>
          )}

          <h2 className="mt-3 text-[23px] font-bold text-[#24212b]">
            {isOccupied ? user.name : "Empty Seat"}
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#85818a]">
            {isOccupied ? `ID: ${user.id}` : `Seat ${user.seat}`}
          </p>

          {/* BADGES */}
          {isOccupied && (
            <div className="mt-3 flex justify-center gap-2">
              <div className="flex h-7 min-w-[50px] items-center justify-center rounded-full bg-[#f7a9d5] px-2.5 text-[13px] font-bold text-white">♀18</div>
              <div className="flex h-7 min-w-[50px] items-center justify-center rounded-full bg-[#e6b681] px-2.5 text-[13px] font-bold text-white">LV.6</div>
              <div className="flex h-7 min-w-[50px] items-center justify-center rounded-full bg-[#9d969d] px-2.5 text-[13px] font-bold text-white">◈ 0</div>
              <div className="flex h-7 min-w-[50px] items-center justify-center rounded-full bg-[#655e82] px-2.5 text-[13px] font-bold text-white">◉ 3</div>
            </div>
          )}
        </div>

        {/* GIFT WALL */}
        {isOccupied && (
          <div className="mt-4 flex h-[72px] items-center rounded-[17px] bg-gradient-to-r from-[#229dd1] via-[#8757df] to-[#d06bdb] px-4 text-white">
            <div className="flex-1 text-left">
              <b className="block text-[17px]">Gift wall</b>
              <span className="text-[14px]">· Earned 30</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-[51px] w-[51px] items-center justify-center rounded-[11px] bg-[#371757]/50 text-[24px]">👑</div>
              <div className="flex h-[51px] w-[51px] items-center justify-center rounded-[11px] bg-[#371757]/50 text-[24px]">🎂</div>
              <div className="flex h-[51px] w-[51px] items-center justify-center rounded-[11px] bg-[#371757]/50 text-[24px]">🏆</div>
              <ChevronRight size={28} className="text-white/80" />
            </div>
          </div>
        )}

        {/* ACTION AREA */}
        <div className="mt-4">
          {!isOccupied ? (
            /* EMPTY SEAT ACTIONS */
            <button
              onClick={() => { onInvite(user.seat); onClose(); }}
              className="flex w-full min-h-[72px] flex-col items-center justify-center gap-2 rounded-[17px] bg-[#f5f4f6] text-[#89858d] active:scale-95 transition"
            >
              <UserPlus size={28} strokeWidth={1.8} />
              <span className="text-[12px] font-semibold">Invite User</span>
            </button>
          ) : (
            /* OCCUPIED SEAT ACTIONS */
            <div className="grid grid-cols-4 gap-2">
              {/* LEAVE */}
              <button
                onClick={() => triggerConfirm("leave")}
                className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-[17px] bg-[#f5f4f6] text-[#89858d] active:scale-95 transition"
              >
                <LogOut size={28} strokeWidth={1.8} />
                <span className="text-[11px] font-semibold">Leave</span>
              </button>

              {/* MUTE */}
              <button
                onClick={() => onMuteToggle(user.seat)}
                className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-[17px] bg-[#f5f4f6] text-[#89858d] active:scale-95 transition"
              >
                {user.muted ? <Mic size={28} strokeWidth={1.8} /> : <MicOff size={28} strokeWidth={1.8} />}
                <span className="text-[11px] font-semibold">{user.muted ? "Unmute" : "Mute"}</span>
              </button>

              {/* KICK */}
              <button
                onClick={() => triggerConfirm("kick")}
                className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-[17px] bg-[#f5f4f6] text-[#89858d] active:scale-95 transition"
              >
                <DoorOpen size={28} strokeWidth={1.8} />
                <span className="text-[11px] font-semibold">Kick Out</span>
              </button>

              {/* ADMIN (Only for Owner) */}
              {currentUserRole === "owner" && (
                <button
                  onClick={() => { onMakeAdmin(user.seat); onClose(); }}
                  className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-[17px] bg-[#f5f4f6] text-[#89858d] active:scale-95 transition"
                >
                  <ShieldCheck size={28} strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold">Admin</span>
                </button>
              )}
            </div>
          )}

          {/* SOCIAL ACTIONS (Follow, Chat, Gift) */}
          {isOccupied && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => onFollowToggle(user.id)}
                className={`flex h-[67px] items-center justify-center gap-2 rounded-[19px] text-white shadow-md active:scale-95 transition ${
                  isFollowing ? "bg-gradient-to-r from-[#7356f5] to-[#28a9ee]" : "bg-gradient-to-r from-[#7356f5] to-[#28a9ee]"
                }`}
              >
                {isFollowing ? <UserCheck size={21} strokeWidth={2.3} /> : <UserPlus size={21} strokeWidth={2.3} />}
                <span className="text-[13px] font-bold">{isFollowing ? "Following" : "Follow"}</span>
              </button>

              <button
                onClick={() => { onChat(user.id); onClose(); }}
                className="flex h-[67px] items-center justify-center gap-2 rounded-[19px] bg-gradient-to-r from-[#ff6040] to-[#ffb22f] text-white shadow-md active:scale-95 transition"
              >
                <MessageCircle size={21} strokeWidth={2.3} />
                <span className="text-[13px] font-bold">Chat</span>
              </button>

              <button
                onClick={() => { onGift(user.id); onClose(); }}
                className="flex h-[67px] items-center justify-center gap-2 rounded-[19px] bg-gradient-to-r from-[#bd59f5] to-[#ed70c8] text-white shadow-md active:scale-95 transition"
              >
                <Gift size={21} strokeWidth={2.3} />
                <span className="text-[13px] font-bold">Gifts</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[330px] rounded-[22px] bg-white p-6 text-center shadow-xl">
            <h3 className="text-[18px] font-bold text-[#24212b]">
              {confirmType === "leave" ? "Leave Seat?" : "Kick Out?"}
            </h3>
            <p className="mt-2 text-[13px] text-[#8b8790]">
              {confirmType === "leave"
                ? `This user will leave seat ${user.seat}.`
                : "This user will be removed from the room."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-[13px] bg-[#f0eff2] py-3 text-[14px] font-bold text-[#55515a] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-[13px] bg-[#7657ed] py-3 text-[14px] font-bold text-white active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}