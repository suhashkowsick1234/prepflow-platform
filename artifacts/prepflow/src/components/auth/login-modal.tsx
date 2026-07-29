import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { Phone, Sparkles, Loader2, ArrowLeft, Mail, User } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";

export function LoginModal() {
  const { showLoginModal, closeLoginModal, loginWithGoogle, loginWithPhone, isLoading } = useAuth();
  const [mode, setMode] = useState<"choose" | "google" | "phone">("choose");
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!googleEmail.trim() || !googleEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    try {
      await loginWithGoogle(googleName, googleEmail);
      resetState();
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setStep("otp");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) {
      setError("Please enter the 4-digit OTP sent to your phone.");
      return;
    }
    setError("");
    try {
      await loginWithPhone(phone, otp);
      resetState();
    } catch {
      setError("Verification failed. Please try again.");
    }
  };

  const resetState = () => {
    setMode("choose");
    setStep("phone");
    setGoogleName("");
    setGoogleEmail("");
    setPhone("");
    setOtp("");
    setError("");
  };

  return (
    <Dialog
      open={showLoginModal}
      onOpenChange={(open) => {
        if (!open) {
          closeLoginModal();
          resetState();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-5 sm:p-6 overflow-hidden rounded-2xl max-w-[92vw]">
        <DialogHeader className="text-center sm:text-center flex flex-col items-center space-y-2">
          <div className="mb-1">
            <AppLogo size={48} showText={false} />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold font-display">
            {mode === "google" ? "Sign In with Google" : mode === "phone" ? "Sign In with Phone" : "Welcome to PrepFlow AI"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {mode === "google"
              ? "Enter your name and email to continue."
              : mode === "phone"
              ? step === "phone"
                ? "Enter your phone number to receive an OTP."
                : "Enter the verification code sent to your phone."
              : "Sign in to save your learning workspaces and progress."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 text-center font-medium">
            {error}
          </div>
        )}

        {mode === "choose" && (
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setMode("google")}
              className="w-full min-h-[44px] h-12 rounded-xl text-sm font-semibold gap-3 border-border/80 hover:bg-secondary justify-center shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              onClick={() => setMode("phone")}
              className="w-full min-h-[44px] h-12 rounded-xl text-sm font-semibold gap-3 border-border/80 hover:bg-secondary justify-center shadow-sm"
            >
              <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
              Continue with Phone Number
            </Button>
          </div>
        )}

        {mode === "google" && (
          <form onSubmit={handleGoogleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="google-name" className="text-xs font-semibold">
                Full Name
              </Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                <Input
                  id="google-name"
                  placeholder="John Doe"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="pl-9 rounded-xl min-h-[44px] h-11 text-base sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                <Input
                  id="google-email"
                  type="email"
                  placeholder="john@example.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="pl-9 rounded-xl min-h-[44px] h-11 text-base sm:text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode("choose");
                  setError("");
                }}
                className="rounded-xl min-h-[44px] h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl min-h-[44px] h-11 font-semibold gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </Button>
            </div>
          </form>
        )}

        {mode === "phone" && step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="phone-input" className="text-xs font-semibold">
                Phone Number
              </Label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                  +1
                </span>
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-l-none rounded-r-xl min-h-[44px] h-11 text-base sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode("choose");
                  setError("");
                }}
                className="rounded-xl min-h-[44px] h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button type="submit" className="flex-1 rounded-xl min-h-[44px] h-11 font-semibold gap-2">
                Send OTP <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {mode === "phone" && step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="otp-input" className="text-xs font-semibold">
                Enter 4-Digit OTP (Use <code className="text-primary font-bold">1234</code> for demo)
              </Label>
              <Input
                id="otp-input"
                type="text"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center tracking-[0.5em] text-lg font-mono rounded-xl min-h-[48px] h-12 text-base sm:text-lg"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="rounded-xl min-h-[44px] h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Change Number
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl min-h-[44px] h-11 font-semibold gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          By continuing, you agree to PrepFlow AI's Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LoginModal;
