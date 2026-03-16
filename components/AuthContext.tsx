"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut as firebaseSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { ALLOWED_DOMAINS } from "@/lib/auth-config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendLoginLink: (email: string) => Promise<void>;
  completeLogin: (url: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sendLoginLink: async () => {},
  completeLogin: async () => {},
  signInWithPassword: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const sendLoginLink = async (email: string) => {
    // Check email domain before even attempting sign-in
    const domain = email.split("@")[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      throw new Error("Unauthorized domain. Only @rollingtrunk.com and @hest.page accounts are allowed.");
    }

    // Save email in localStorage so we don't have to ask for it again
    window.localStorage.setItem('emailForSignIn', email);

    const actionCodeSettings = {
      url: window.location.origin + '/login', // redirect back to login page
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  };

  const completeLogin = async (url: string) => {
    if (!isSignInWithEmailLink(auth, url)) return;

    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt("Please provide your email to confirm sign-in");
    }
    
    if (!email) throw new Error("Email is required to complete sign-in.");

    const result = await signInWithEmailLink(auth, email, url);
    window.localStorage.removeItem('emailForSignIn');
    await exchangeTokenForSession(result.user);
    router.push("/");
  };

  const signInWithPassword = async (email: string, password: string) => {
    const domain = email.split("@")[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      throw new Error("Unauthorized domain. Only @rollingtrunk.com and @hest.page accounts are allowed.");
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    await exchangeTokenForSession(result.user);
    router.push("/");
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  const exchangeTokenForSession = async (firebaseUser: User) => {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      await firebaseSignOut(auth);
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create session");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendLoginLink, completeLogin, signInWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
