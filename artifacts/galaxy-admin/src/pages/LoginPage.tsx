// src/pages/LoginPage.tsx – Firebase Auth (Email/Password)
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, ArrowLeft, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin, DEMO_USERNAME, DEMO_PASSWORD } from "@/App";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type View = "login" | "forgot";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("login");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [, navigate] = useLocation();
  const { adminUser, setAdminLoggedIn } = useAdmin();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser) navigate("/");
  }, [adminUser, navigate]);

  // ─── Main Login ─────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Demo Login
    if (email === DEMO_USERNAME && password === DEMO_PASSWORD) {
      await setAdminLoggedIn(true, true);
      navigate("/");
      setLoading(false);
      return;
    }

    // Firebase Auth Login
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await setAdminLoggedIn(true, false);
      toast({ title: "Welcome back! 🎉", description: "Logged in successfully." });
      navigate("/");
    } catch (err: any) {
      let msg = "Invalid email or password.";
      if (err.code === "auth/user-not-found") msg = "No account found with this email.";
      else if (err.code === "auth/wrong-password") msg = "Incorrect password.";
      else if (err.code === "auth/invalid-email") msg = "Please enter a valid email.";
      else if (err.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
      else if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
      setError(msg);
    }
    setLoading(false);
  }

  // ─── Forgot Password ─────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!resetEmail.trim()) {
      setError("Please enter your email.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
      toast({ title: "Reset link sent! 📧", description: `Check ${resetEmail} inbox.` });
    } catch (err: any) {
      let msg = "Failed to send reset email.";
      if (err.code === "auth/user-not-found") msg = "No account found with this email.";
      else if (err.code === "auth/invalid-email") msg = "Please enter a valid email.";
      setError(msg);
    }
    setResetLoading(false);
  }

  function handleDemoLogin() {
    setEmail(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Galaxy Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === "login" ? "Sign in with your email" : "Reset your password"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">

          {/* ═══ LOGIN VIEW ═══ */}
          {view === "login" && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm text-foreground/80">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-foreground/80">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); setResetEmail(email); }}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pl-9 pr-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </Button>
              </form>

              {/* Demo Login */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-300">Demo Account (View Only)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Username: <span className="text-white font-mono">demo</span> &nbsp;|&nbsp;
                      Password: <span className="text-white font-mono">demo123</span>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDemoLogin}
                  className="w-full text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  Fill Demo Credentials
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Restricted to authorized admins only
              </p>
            </>
          )}

          {/* ═══ FORGOT PASSWORD VIEW ═══ */}
          {view === "forgot" && (
            <>
              <button
                onClick={() => { setView("login"); setError(""); setResetSent(false); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>

              {!resetSent ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                    <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-sm text-foreground/80">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="admin@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    {resetLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Check your inbox!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We've sent a password reset link to:
                    <br />
                    <span className="text-white font-mono text-xs">{resetEmail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Didn't receive it? Check spam folder or try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setResetSent(false); setResetEmail(""); }}
                    className="w-full text-xs"
                  >
                    Send Again
                  </Button>
                  <button
                    onClick={() => { setView("login"); setResetSent(false); }}
                    className="text-xs text-primary hover:text-primary/80 font-medium mt-3"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}