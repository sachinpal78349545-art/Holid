interface Props {
  onClose: () => void;
}

export default function PrivacyPolicyPage({ onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(160deg, #0d001a 0%, #1a0030 100%)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Poppins', 'Inter', sans-serif",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#00ffff" }}>📜 Privacy Policy</h2>
          <button onClick={onClose} aria-label="Close privacy policy" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "rgba(162,155,254,0.5)" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(0,255,255,0.5)", marginBottom: 12 }}>
            Effective Date: May 15, 2026<br />
            Developed by: Galaxy Development Team
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginTop: 8, marginBottom: 4 }}>1. Information We Collect</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12 }}>
            To provide a seamless and secure social experience, we collect the following information:<br />
            • Account Information: Your mobile number and password provided during registration to secure your identity.<br />
            • User Profile: Details such as your display name, avatar, gender, and date of birth.<br />
            • Activity Data: Metadata regarding your interactions, such as which voice rooms you join and the duration of your stay. We do not monitor or record private voice conversations.<br />
            • Technical Data: For security and anti-spam purposes, we collect device identifiers (Android ID/IMEI), IP addresses, and operating system versions.
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>2. Permissions & Features</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12 }}>
            The App requires the following system permissions to function:<br />
            • Microphone Access: To enable real-time voice chat within rooms via the integrated SDK.<br />
            • Storage/Photo Library: To allow you to upload profile pictures and share media within the community.<br />
            • Push Notifications: To send alerts regarding room invitations, virtual gifts, and system updates.
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>3. Data Usage & Security</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12 }}>
            • Service Optimization: We use your data to manage your account level (XP), VIP status, and digital badges.<br />
            • Security Measures: We utilize secure, encrypted servers to ensure your personal information is protected against unauthorized access.<br />
            • Third-Party Services: We use high-quality voice streaming SDKs that operate under their own strict privacy standards to ensure data integrity.
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>4. Safety & Age Restriction</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12 }}>
            Galaxy Voice Chat is strictly for individuals aged 18 and older. We do not knowingly permit minors to use the platform. If we discover that a user is under the age of 18, their account will be terminated immediately.
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>5. Account Deletion</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 12 }}>
            Users may request to delete their account at any time through the App settings. Please ensure that all virtual balances (diamonds) are cleared before deletion, as this data cannot be recovered once the account is removed.
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD700", marginBottom: 4 }}>6. Contact Support</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
            If you have any questions, technical issues, or wish to appeal an account ban, please contact our official support team at:<br />
            📧 <span style={{ color: "#00ffff" }}>galaxyvoicechat.support@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}