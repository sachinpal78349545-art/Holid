// UserSetupPage.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { User as FBUser } from "firebase/auth";
import { updateUser } from "../lib/userService";
import { useToast } from "../lib/toastContext";
import { ChevronLeft, ChevronRight, Check, UserRound, Cake, User, FileText } from "lucide-react";

interface Props {
  user: FBUser;
  onComplete: () => void;
}

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Dubai", "Singapore"];

const BASE = import.meta.env.BASE_URL || "/";
const BOYS_AVATARS = Array.from({ length: 10 }, (_, i) => `${BASE}/boys/boy${i + 1}.jpg`);
const GIRLS_AVATARS = Array.from({ length: 10 }, (_, i) => `${BASE}/girls/girl${i + 1}.jpg`);

export default function UserSetupPage({ user, onComplete }: Props) {
  const { showToast } = useToast();

  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [country, setCountry] = useState("India");
  const [dob, setDob] = useState("2000-01-01");
  const [bio, setBio] = useState("Hey! I am new to Galaxy Voice Chat 🌌");
  const [saving, setSaving] = useState(false);

  const avatarList = useMemo(
    () => (gender === "Female" ? GIRLS_AVATARS : BOYS_AVATARS),
    [gender]
  );

  useEffect(() => {
    setAvatarIndex(0);
  }, [gender]);

  const age = useMemo(() => {
    if (!dob) return 0;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
  }, [dob]);

  const nextAvatar = () => setAvatarIndex((p) => (p + 1) % avatarList.length);
  const prevAvatar = () =>
    setAvatarIndex((p) => (p - 1 + avatarList.length) % avatarList.length);

  const touchStartRef = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 55) {
      diff > 0 ? prevAvatar() : nextAvatar();
    }
    touchStartRef.current = null;
  };

  const isFormValid = useMemo(() => {
    return (
      displayName.trim().length >= 2 &&
      age >= 18 &&
      age <= 100 &&
      bio.trim().length >= 3
    );
  }, [displayName, age, bio]);

  const handleSubmit = async () => {
    const trimmed = displayName.trim();

    if (!trimmed) return showToast("Please enter your name", "warning", "✏️");
    if (trimmed.length < 2) return showToast("Name must be 2+ characters", "warning");
    if (age < 18) return showToast("You must be 18 or older", "error", "🚫");
    if (age > 100) return showToast("Please enter a valid birthday", "warning");
    if (bio.trim().length < 3) return showToast("Please add a short bio", "warning");

    setSaving(true);
    try {
      await updateUser(user.uid, {
        name: trimmed,
        gender,
        country,
        birthday: dob,
        bio: bio.trim(),
        avatar: avatarList[avatarIndex],
        profileCompleted: true,
        createdAt: Date.now(),
        email: user.email || "",
        uid: user.uid,
      } as any);

      showToast("Profile created! Welcome to Galaxy 🎉", "success");
      onComplete();
    } catch (err) {
      console.error("Setup save error:", err);
      showToast("Couldn't save profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (confirm("Leave setup? Your progress will be lost.")) window.history.back();
  };

  return (
    <div className="sp-page">
      <div className="sp-bg">
        <div className="sp-blob sp-blob-1" />
        <div className="sp-blob sp-blob-2" />
        <div className="sp-blob sp-blob-3" />
      </div>

      <header className="sp-header">
        <button onClick={handleBack} className="sp-back" type="button" aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <div className="sp-header-text">
          <p className="sp-title">Create Your Profile</p>
          <p className="sp-subtitle">Make your Galaxy identity</p>
        </div>
        <div style={{ width: 44, height: 44 }} />
      </header>

      <main className="sp-main">
        <div className="sp-progress">
          <div className="sp-progress-bar active" />
          <div className="sp-progress-bar active" />
          <div className="sp-progress-bar" />
          <div className="sp-progress-bar" />
        </div>

        <div className="sp-title-block">
          <h1>
            Tell us about
            <br />
            <span>yourself ✨</span>
          </h1>
          <p>Choose your profile picture and add a few details.</p>
        </div>

        {/* GENDER SELECTOR */}
        <section className="sp-field sp-gender-field">
          <div className="sp-field-header">
            <div className="sp-field-icon icon-pink">
              <User size={17} />
            </div>
            <span className="sp-field-label">Select Gender First</span>
          </div>
          <div className="sp-gender-row">
            {(["Male", "Female", "Other"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`sp-gender-btn ${gender === g ? "active" : ""}`}
              >
                {g === "Male" ? "👦 Male" : g === "Female" ? "👧 Female" : "🌈 Other"}
              </button>
            ))}
          </div>
        </section>

        {/* AVATAR CARD */}
        <section className="sp-avatar-card">
          <div className="sp-avatar-header">
            <p>
              Choose your avatar{" "}
              <span style={{ color: "#8052e8" }}>
                ({gender === "Female" ? "Girls" : "Boys"})
              </span>
            </p>
            <p>Swipe or use the arrows</p>
          </div>

          <div className="sp-avatar-slider" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <button type="button" onClick={prevAvatar} className="sp-arrow sp-arrow-left" aria-label="Previous">
              <ChevronLeft size={21} />
            </button>

            <div className="sp-side-avatar sp-side-avatar-left">
              <img
                src={avatarList[(avatarIndex - 1 + avatarList.length) % avatarList.length]}
                alt=""
                onError={(e) => ((e.target as HTMLImageElement).src = avatarList[0])}
              />
            </div>

            <div className="sp-main-avatar">
              <div className="sp-avatar-gradient" />
              <img
                src={avatarList[avatarIndex]}
                alt="Selected avatar"
                onError={(e) => ((e.target as HTMLImageElement).src = avatarList[0])}
              />
              <div className="sp-online-dot" />
            </div>

            <div className="sp-side-avatar sp-side-avatar-right">
              <img
                src={avatarList[(avatarIndex + 1) % avatarList.length]}
                alt=""
                onError={(e) => ((e.target as HTMLImageElement).src = avatarList[0])}
              />
            </div>

            <button type="button" onClick={nextAvatar} className="sp-arrow sp-arrow-right" aria-label="Next">
              <ChevronRight size={21} />
            </button>
          </div>

          <div className="sp-dots">
            {avatarList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvatarIndex(i)}
                className={`sp-dot ${i === avatarIndex ? "active" : ""}`}
                aria-label={`Avatar ${i + 1}`}
              />
            ))}
          </div>

          <p className="sp-avatar-count">
            Avatar {avatarIndex + 1} of {avatarList.length}
          </p>
        </section>

        {/* NAME */}
        <section className="sp-form">
          <div className="sp-field">
            <div className="sp-field-header">
              <div className="sp-field-icon icon-purple">
                <UserRound size={17} />
              </div>
              <span className="sp-field-label">Your Name</span>
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="Enter your name"
              maxLength={30}
              className="sp-input"
            />
            <div className="sp-char-count">{displayName.length}/30</div>
          </div>

          <div className="sp-grid-2">
            <div className="sp-field">
              <div className="sp-field-header">
                <div className="sp-field-icon icon-orange">
                  <Cake size={17} />
                </div>
                <span className="sp-field-label">Birthday</span>
              </div>
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDob(e.target.value)}
                className="sp-input sp-input-date"
                style={{ colorScheme: "light" }}
              />
              <p className="sp-age-hint">{age > 0 ? `${age} years old` : "Select birthday"}</p>
            </div>

            <div className="sp-field">
              <div className="sp-field-header">
                <div className="sp-field-icon icon-blue">
                  <span style={{ fontSize: 14 }}>🌍</span>
                </div>
                <span className="sp-field-label">Country</span>
              </div>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="sp-input sp-input-select"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sp-field">
            <div className="sp-field-header">
              <div className="sp-field-icon icon-cyan">
                <FileText size={17} />
              </div>
              <span className="sp-field-label">About You</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 120))}
              placeholder="Write something about yourself..."
              rows={3}
              maxLength={120}
              className="sp-input sp-textarea"
            />
            <div className="sp-char-count">{bio.length}/120</div>
          </div>
        </section>

        {/* PREVIEW */}
        <div className="sp-preview">
          <div className="sp-preview-row">
            <img
              src={avatarList[avatarIndex]}
              className="sp-preview-avatar"
              alt=""
              onError={(e) => ((e.target as HTMLImageElement).src = avatarList[0])}
            />
            <div className="sp-preview-info">
              <p className="sp-preview-name">{displayName.trim() || "Your Name"}</p>
              <p className="sp-preview-meta">
                {age > 0 ? `${age} years` : "Age"} • {gender} • {country}
              </p>
            </div>
            {isFormValid && (
              <div className="sp-preview-check">
                <Check size={17} />
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !isFormValid}
          className={`sp-submit ${saving || !isFormValid ? "disabled" : ""}`}
        >
          {saving ? (
            <>
              <span className="sp-spinner" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ChevronRight size={20} style={{ marginLeft: 4 }} />
            </>
          )}
        </button>

        <p className="sp-hint">You can change these details later from Edit Profile.</p>
      </main>

      <style>{`
        .sp-page {
          min-height: 100dvh;
          width: 100%;
          background: #f8f7ff;
          color: #272342;
          font-family: Arial, Helvetica, sans-serif;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        .sp-page * { box-sizing: border-box; }

        .sp-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
        .sp-blob { position: absolute; border-radius: 50%; filter: blur(80px); }
        .sp-blob-1 { top: -100px; left: -100px; width: 280px; height: 280px; background: #d9d0ff; opacity: .6; }
        .sp-blob-2 { top: 160px; right: -100px; width: 320px; height: 320px; background: #dcecff; opacity: .7; }
        .sp-blob-3 { bottom: 0; left: 50%; transform: translateX(-50%); width: 280px; height: 280px; background: #eee4ff; opacity: .8; }

        .sp-header { display: flex; height: 70px; align-items: center; justify-content: space-between; padding: 0 20px; }
        .sp-back { display: flex; height: 44px; width: 44px; align-items: center; justify-content: center; border-radius: 16px; background: #fff; box-shadow: 0 2px 8px rgba(77,61,130,.08); border: 0; cursor: pointer; color: #272342; }
        .sp-back:active { transform: scale(.95); }
        .sp-header-text { text-align: center; }
        .sp-title { font-size: 17px; font-weight: 800; margin: 0; }
        .sp-subtitle { font-size: 11px; color: #9893b4; margin: 2px 0 0; font-weight: 500; }

        .sp-main { max-width: 430px; margin: 0 auto; padding: 0 20px 40px; }

        .sp-progress { display: flex; gap: 8px; margin-bottom: 20px; }
        .sp-progress-bar { height: 6px; flex: 1; border-radius: 4px; background: #e5e1f1; transition: background .3s; }
        .sp-progress-bar.active { background: #7c4dff; }

        .sp-title-block { margin-bottom: 20px; }
        .sp-title-block h1 { font-size: 28px; font-weight: 900; line-height: 1.1; margin: 0; }
        .sp-title-block h1 span { color: #8052e8; }
        .sp-title-block p { margin: 8px 0 0; font-size: 14px; line-height: 1.4; color: #8984a5; }

        /* GENDER */
        .sp-gender-field { margin-bottom: 16px; }
        .sp-gender-row { display: flex; gap: 8px; margin-top: 4px; }
        .sp-gender-btn {
          flex: 1; padding: 12px 0; border-radius: 14px;
          border: 1.5px solid #eeeaf8; background: #faf9ff;
          color: #7a749a; font-family: inherit; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all .2s;
        }
        .sp-gender-btn.active {
          background: linear-gradient(135deg, #efe5ff, #f3e9ff);
          border-color: #8052e8; color: #682dd1;
          box-shadow: 0 4px 14px rgba(128,82,232,.18);
        }
        .sp-gender-btn:active { transform: scale(.97); }

        /* FIELD */
        .sp-field { border-radius: 22px; background: #fff; padding: 16px; box-shadow: 0 8px 25px rgba(77,61,130,.06); }
        .sp-field-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .sp-field-icon { display: flex; height: 32px; width: 32px; align-items: center; justify-content: center; border-radius: 12px; font-size: 17px; }
        .icon-purple { background: #eee8ff; color: #8052e8; }
        .icon-orange { background: #fff0df; color: #e89a45; }
        .icon-pink   { background: #ffe8f2; color: #db70a3; }
        .icon-blue   { background: #e4f6ff; color: #4c9dc7; }
        .icon-cyan   { background: #e4f6ff; color: #4c9dc7; }
        .sp-field-label { font-size: 12px; font-weight: 700; color: #9993b1; }
        .sp-input { width: 100%; background: transparent; border: 0; outline: none; font-family: inherit; font-size: 16px; font-weight: 700; color: #272342; padding: 0; }
        .sp-input::placeholder { color: #c3bfd1; font-weight: 500; }
        .sp-input-date { font-size: 14px; font-weight: 600; }
        .sp-input-select { cursor: pointer; font-size: 16px; font-weight: 700; }
        .sp-textarea { resize: none; font-size: 14px; font-weight: 600; line-height: 1.4; padding: 0; }
        .sp-age-hint { margin: 6px 0 0; font-size: 10px; color: #aaa5c0; font-weight: 600; }
        .sp-char-count { text-align: right; font-size: 10px; color: #aaa5c0; margin-top: 4px; }
        .sp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sp-form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }

        /* AVATAR */
        .sp-avatar-card { border-radius: 30px; background: #fff; padding: 24px 20px; box-shadow: 0 12px 40px rgba(77,61,130,.10); }
        .sp-avatar-header { text-align: center; margin-bottom: 16px; }
        .sp-avatar-header p:first-child { font-size: 15px; font-weight: 800; margin: 0; }
        .sp-avatar-header p:last-child { font-size: 12px; color: #aaa5c0; margin: 4px 0 0; }
        .sp-avatar-slider { position: relative; display: flex; align-items: center; justify-content: center; min-height: 156px; touch-action: pan-y; }
        .sp-arrow { position: absolute; z-index: 10; display: flex; height: 44px; width: 44px; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #eeeaf8; background: #fff; box-shadow: 0 4px 12px rgba(77,61,130,.1); cursor: pointer; color: #272342; }
        .sp-arrow:active { transform: scale(.92); }
        .sp-arrow-left { left: 0; }
        .sp-arrow-right { right: 0; }
        .sp-side-avatar { position: absolute; height: 76px; width: 76px; overflow: hidden; border-radius: 50%; opacity: .35; transition: all .3s; }
        .sp-side-avatar img { height: 100%; width: 100%; object-fit: cover; }
        .sp-side-avatar-left { left: 34px; }
        .sp-side-avatar-right { right: 34px; }
        .sp-main-avatar { position: relative; height: 156px; width: 156px; overflow: hidden; border-radius: 50%; padding: 5px; z-index: 2; background: #eee5ff; }
        .sp-avatar-gradient { position: absolute; inset: 0; border-radius: 50%; background: linear-gradient(90deg, #9d55ff, #c18cff, #63c8ff); }
        .sp-main-avatar img { position: relative; height: 100%; width: 100%; border-radius: 50%; object-fit: cover; }
        .sp-online-dot { position: absolute; bottom: 12px; right: 12px; height: 28px; width: 28px; border-radius: 50%; border: 4px solid #fff; background: #31d17c; }
        .sp-dots { display: flex; justify-content: center; gap: 5px; margin-top: 20px; flex-wrap: wrap; }
        .sp-dot { height: 6px; width: 6px; border-radius: 4px; background: #ddd9ec; border: 0; cursor: pointer; transition: all .3s; padding: 0; }
        .sp-dot.active { width: 24px; background: #8052e8; }
        .sp-avatar-count { margin: 12px 0 0; text-align: center; font-size: 11px; font-weight: 500; color: #aaa5c0; }

        /* PREVIEW */
        .sp-preview { margin-top: 20px; border-radius: 24px; background: #f0ecff; padding: 14px 16px; }
        .sp-preview-row { display: flex; align-items: center; gap: 12px; }
        .sp-preview-avatar { height: 48px; width: 48px; border-radius: 50%; object-fit: cover; outline: 2px solid #fff; flex-shrink: 0; background: #eee5ff; }
        .sp-preview-info { min-width: 0; flex: 1; }
        .sp-preview-name { font-size: 14px; font-weight: 800; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-preview-meta { font-size: 11px; color: #918ba9; margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-preview-check { display: flex; height: 32px; width: 32px; align-items: center; justify-content: center; border-radius: 50%; background: #fff; color: #8052e8; flex-shrink: 0; }

        /* SUBMIT */
        .sp-submit { margin-top: 20px; display: flex; height: 58px; width: 100%; align-items: center; justify-content: center; border-radius: 20px; border: 0; background: linear-gradient(90deg, #8b4de8, #b05cff); color: #fff; font-family: inherit; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 25px rgba(130,73,230,.28); transition: all .2s; }
        .sp-submit:active:not(.disabled) { transform: scale(.98); }
        .sp-submit.disabled { background: #d9d3e8; color: #9c95b5; box-shadow: none; cursor: not-allowed; }
        .sp-spinner { height: 16px; width: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; display: inline-block; margin-right: 8px; animation: spSpin .7s linear infinite; }
        @keyframes spSpin { to { transform: rotate(360deg); } }
        .sp-hint { margin: 12px 0 0; text-align: center; font-size: 10px; color: #aaa5c0; font-weight: 500; }

        @media (max-width: 380px) {
          .sp-title-block h1 { font-size: 24px; }
          .sp-main-avatar { height: 140px; width: 140px; }
          .sp-side-avatar { height: 64px; width: 64px; }
          .sp-side-avatar-left { left: 28px; }
          .sp-side-avatar-right { right: 28px; }
          .sp-gender-btn { font-size: 12px; padding: 11px 0; }
        }
      `}</style>
    </div>
  );
}