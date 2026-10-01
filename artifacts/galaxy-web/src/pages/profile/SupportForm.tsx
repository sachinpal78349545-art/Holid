import { useState } from "react";
import { UserProfile, reportUser } from "../../lib/userService";
import { storage } from "../../lib/firebase";
import { useToast } from "../../lib/toastContext";

export type SupportKind = "report" | "feedback";

interface Props {
  kind: SupportKind;
  user: UserProfile;
  onClose: () => void;
}

const REPORT_REASONS = ["Underage", "Abuse", "Spam", "Illegal", "App issues", "Room violations", "Violence", "Other"];
const FEEDBACK_CATEGORIES = ["Underage", "App problems", "Suggestion", "Hashtag", "Recharge", "Room", "Login", "Others"];
const MAX_ATTACHMENTS = 3;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

export default function SupportForm({ kind, user, onClose }: Props) {
  const { showToast } = useToast();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isFeedback = kind === "feedback";
  const accent = isFeedback ? "#a29bfe" : "#ff6482";
  const choices = isFeedback ? FEEDBACK_CATEGORIES : REPORT_REASONS;

  const addPhotos = (files: FileList | null, input: HTMLInputElement) => {
    setPickerOpen(false);
    if (!files?.length) return;
    setAttachments(current => {
      const videoCount = current.filter(file => file.type.startsWith("video/")).length;
      const photoLimit = videoCount ? 2 : 3;
      const photos = current.filter(file => file.type.startsWith("image/")).length;
      const accepted: File[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (photos + accepted.length >= photoLimit || current.length + accepted.length >= MAX_ATTACHMENTS) {
          showToast("Select up to 3 items: Max 3 photos OR 1 video + 2 photos", "warning");
          break;
        }
        accepted.push(file);
      }
      return [...current, ...accepted];
    });
    input.value = "";
  };

  const addVideo = (file: File | undefined, input: HTMLInputElement) => {
    setPickerOpen(false);
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) {
      showToast("Size of a single video cannot exceed 20 MB", "warning");
      input.value = "";
      return;
    }
    setAttachments(current => {
      const photos = current.filter(item => item.type.startsWith("image/")).length;
      const videos = current.filter(item => item.type.startsWith("video/")).length;
      if (videos >= 1 || photos > 2 || current.length >= MAX_ATTACHMENTS) {
        showToast("Select up to 3 items: Max 3 photos OR 1 video + 2 photos", "warning");
        return current;
      }
      return [...current, file];
    });
    input.value = "";
  };

  const handleSubmit = async () => {
    if (!reason) {
      showToast(isFeedback ? "Please select a category" : "Please select a reason", "warning");
      return;
    }
    if (!details.trim()) {
      showToast(isFeedback ? "Please describe your feedback" : "Please describe the issue", "warning");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl = "";
      const attachment = attachments[0];
      if (attachment) {
        if (attachment.size > MAX_VIDEO_SIZE) {
          showToast("Size of a single video cannot exceed 20 MB", "warning");
          return;
        }
        const fileRef = storage.ref(`reports/${user.uid}/${Date.now()}_${attachment.name}`);
        await fileRef.uploadBytes(attachment);
        attachmentUrl = await fileRef.getDownloadURL();
      }
      await reportUser(user.uid, isFeedback ? "feedback" : (target || "general"), reason, details, attachmentUrl);
      showToast(isFeedback ? "Thank you for your feedback!" : "Thank you for your report!", "success");
      onClose();
    } catch {
      showToast("Failed to submit. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setPickerOpen(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "linear-gradient(160deg, #0d001a 0%, #1a0030 100%)",
      zIndex: 1100, display: "flex", flexDirection: "column", fontFamily: "'Poppins', 'Inter', sans-serif",
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>{isFeedback ? "💬 Send Feedback" : "⚠️ Report Issue"}</h2>
          <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "rgba(162,155,254,0.5)" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isFeedback && (
            <input className="input-field" placeholder="User ID (optional)" value={target}
              onChange={event => setTarget(event.target.value)} style={{ borderRadius: 14, padding: "12px 14px" }} />
          )}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: `${accent}99`, margin: "0 0 10px" }}>
              {isFeedback ? "Select Category" : "Select Reason"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {choices.map(choice => (
                <button key={choice} onClick={() => setReason(choice)} style={{
                  padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: reason === choice ? (isFeedback ? "linear-gradient(90deg, #C084FC, #818CF8)" : "rgba(255,70,110,0.25)") : "rgba(255,255,255,0.05)",
                  color: reason === choice ? "#fff" : `${accent}99`, fontSize: 12, fontWeight: 600,
                }}>{choice}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: `${accent}99`, margin: "0 0 6px" }}>
              {isFeedback ? "Description" : "Details"}
            </p>
            <div style={{ position: "relative" }}>
              <textarea className="input-field"
                placeholder={isFeedback ? "Describe your feedback in detail..." : "Describe the issue you are experiencing..."}
                value={details} onChange={event => setDetails(event.target.value.slice(0, 200))}
                rows={4} style={{ borderRadius: 14, padding: "12px 14px 28px", resize: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, pointerEvents: "none", color: details.length >= 180 ? "#f43f5e" : "rgba(162,155,254,0.4)" }}>{details.length}/200</span>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: `${accent}99`, margin: 0 }}>{isFeedback ? "Attachments" : "Evidence"} (Optional)</p>
              <span style={{ fontSize: 11, color: "rgba(162,155,254,0.4)" }}>{attachments.length}/{MAX_ATTACHMENTS}</span>
            </div>
            {attachments.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} style={{ position: "relative" }}>
                    <div style={{ width: 62, height: 62, borderRadius: 10, background: `${accent}22`, border: `1px solid ${accent}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      <span>{file.type.startsWith("image/") ? "🖼️" : "🎬"}</span>
                      <span style={{ fontSize: 9 }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                    <button onClick={() => setAttachments(current => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove ${file.name}`} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, background: "#ff4757", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 10 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {attachments.length < MAX_ATTACHMENTS && (
              <button onClick={() => setPickerOpen(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "rgba(255,255,255,0.04)", border: `1.5px dashed ${accent}66`, borderRadius: 14, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                <span style={{ fontSize: 20 }}>📎</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "rgba(162,155,254,0.6)", textAlign: "left" }}>Add photo/video · Max 3 photos OR 1 video + 2 photos</span>
                <span style={{ fontSize: 22, color: accent }}>+</span>
              </button>
            )}
          </div>

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: "100%", padding: "16px 0", borderRadius: 22, border: "none",
            background: isFeedback ? "radial-gradient(ellipse at center, #7c3aed 0%, #4f46e5 100%)" : "linear-gradient(90deg, #ff4757, #c0392b)",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1, fontFamily: "inherit",
          }}>{submitting ? "Submitting..." : isFeedback ? "Submit Feedback" : "Submit Report"}</button>
        </div>
      </div>

      {pickerOpen && (
        <div onClick={() => setPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 6000, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "flex-end" }}>
          <div onClick={event => event.stopPropagation()} style={{ background: "linear-gradient(180deg,#1e1040,#0d0926)", borderRadius: "24px 24px 0 0", padding: "20px 16px 40px", width: "100%", maxWidth: 430, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 18px" }}>Add {isFeedback ? "Attachment" : "Evidence"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", background: `${accent}18`, border: `1px solid ${accent}55`, borderRadius: 16, cursor: "pointer", color: "#fff" }}>
                <span style={{ fontSize: 26 }}>📷</span><span style={{ flex: 1 }}>Picture</span>
                <input type="file" accept="image/*" multiple hidden onChange={event => addPhotos(event.target.files, event.target)} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", background: `${accent}18`, border: `1px solid ${accent}55`, borderRadius: 16, cursor: "pointer", color: "#fff" }}>
                <span style={{ fontSize: 26 }}>🎬</span><span style={{ flex: 1 }}>Video · Max 20MB</span>
                <input type="file" accept="video/*" hidden onChange={event => addVideo(event.target.files?.[0], event.target)} />
              </label>
              <button onClick={() => setPickerOpen(false)} style={{ padding: 15, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(162,155,254,0.7)", fontFamily: "inherit", fontSize: 15, fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}