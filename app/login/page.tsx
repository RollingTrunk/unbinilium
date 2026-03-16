"use client";

import { useAuth } from "@/components/AuthContext";
import { Mail, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { isSignInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function LoginPage() {
  const { sendLoginLink, completeLogin, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);

  useEffect(() => {
    // Check if user is returning from an email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setVerifyingLink(true);
      completeLogin(window.location.href).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to complete sign-in from link.");
        setVerifyingLink(false);
      });
    }
  }, [completeLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (usePassword) {
        await signInWithPassword(email, password);
      } else {
        await sendLoginLink(email);
        setEmailSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (usePassword ? "Failed to sign in." : "Failed to send magic link."));
    } finally {
      setLoading(false);
    }
  };

  if (verifyingLink) {
    return (
      <div className="glass p-10 rounded-3xl w-full max-w-md text-center">
        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold mb-2">Verifying login...</h2>
        <p className="text-secondary text-sm">Please wait while we complete your sign-in.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mt-6 text-sm text-left">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="glass p-10 rounded-3xl w-full max-w-md text-center">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-secondary text-sm mb-6">
          We've sent a magic link to <span className="font-semibold text-white">{email}</span>. Click the link to sign in.
        </p>
        <button 
          onClick={() => setEmailSent(false)}
          className="text-sm text-primary hover:underline"
        >
          Try another email address
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-10 rounded-3xl w-full max-w-md">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Hest Unbinilium</h1>
        <p className="text-secondary text-sm mt-1">Sign in with a magic link</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@rollingtrunk.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
            />
          </div>
        </div>
        {usePassword && (
          <div className="flex flex-col gap-1.5 mt-2">
            <label htmlFor="password" className="text-sm font-medium text-secondary">Password</label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required={usePassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              />
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !email || (usePassword && !password)}
          className="mt-2 w-full bg-primary text-background hover:bg-primary/90 font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : usePassword ? "Sign in" : "Send Magic Link"}
        </button>
      </form>
      
      <button 
        onClick={() => setUsePassword(!usePassword)}
        className="text-sm text-secondary hover:text-primary transition-colors mt-6 w-full text-center"
      >
        {usePassword ? "Sign in with magic link instead" : "Sign in with password instead"}
      </button>
    </div>
  );
}
