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
import { Brain, Phone, Sparkles, Loader2, ArrowLeft, Mail, User } from "lucide-react";

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
      <DialogContent className="sm:max-w-md p-6 overflow-hidden">
        <DialogHeader className="text-center sm:text-center flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            <Brain className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-bold font-display">
            {mode === "google" ? "Sign In with Google" : mode === "phone" ? "Sign In with Phone" : "Welcome to PrepFlow AI"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === "google"
              ? "Enter your name and email to continue."
              : mode === "phone"
              ? step === "otp"
                ? "Enter the OTP sent to your phone."
                : "Enter your phone number to receive a verification code."
              : "Sign in to sync your study progress, saved workspaces, and bookmarks."}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="space-y-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => { setMode("google"); setError(""); }}
              className="w-full py-6 font-semibold flex items-center justify-center gap-3 border-border/80 hover:bg-secondary/60 transition-all rounded-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs font-mono text-muted-foreground uppercase">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => { setMode("phone"); setError(""); }}
              className="w-full py-6 font-semibold flex items-center justify-center gap-3 rounded-xl"
            >
              <Phone className="w-5 h-5 text-primary" />
              Continue with Phone Number
            </Button>

            <p className="text-[11px] text-center text-muted-foreground pt-2">
              By continuing, you agree to PrepFlow's Terms of Service and Privacy Policy.
            </p>
          </div>
        ) : mode === "google" ? (
          <form onSubmit={handleGoogleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="google-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="google-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  autoFocus
                  className="h-12 text-base pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="google-email"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="h-12 text-base pl-10"
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button type="submit" size="lg" disabled={isLoading} className="w-full h-12 rounded-xl font-bold gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Sign In</>}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setMode("choose"); setError(""); }}
              className="w-full text-xs text-muted-foreground gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to all options
            </Button>
          </form>
        ) : step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                className="h-12 text-base"
              />
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-bold gap-2">
              Send OTP Code <Sparkles className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setMode("choose"); setError(""); }}
              className="w-full text-xs text-muted-foreground gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to all options
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4 pt-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                Enter the 4-digit code sent to <strong className="text-foreground">{phone}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp" className="sr-only">
                OTP Code
              </Label>
              <Input
                id="otp"
                type="text"
                maxLength={4}
                placeholder="1 2 3 4"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                className="h-14 text-center text-2xl font-mono tracking-[0.5em] font-bold"
              />
            </div>

            {error && <p className="text-xs text-rose-500 text-center font-medium">{error}</p>}

            <Button type="submit" size="lg" disabled={isLoading} className="w-full h-12 rounded-xl font-bold">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("phone")}
              className="w-full text-xs text-muted-foreground gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change phone number
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
