import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Hest Unbi",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {children}
    </div>
  );
}
