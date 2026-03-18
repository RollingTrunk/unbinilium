"use client";

import { AlertCircle, Bell, CheckCircle2, Loader2, Send, Users, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DispatchesTable } from "@/components/DispatchesTable";
import Image from "next/image";

interface User {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [mode, setMode] = useState<"broadcast" | "direct">("broadcast");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (mode === "direct" && users.length === 0) {
      fetchUsers();
    }
  }, [mode]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users?limit=100");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "direct" && !targetUserId) {
      setStatus({ type: "error", message: "Please select a user." });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      const endpoint = mode === "broadcast" ? "/api/notifications/broadcast" : "/api/notifications/direct";
      const payload = mode === "broadcast" 
        ? { title, body } 
        : { userId: targetUserId, title, body };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: mode === "broadcast" ? `Successfully sent to ${data.sent} devices!` : "Notification sent successfully!" });
        setTitle("");
        setBody("");
        setRefreshTrigger(prev => prev + 1);
      } else {
        setStatus({ type: "error", message: data.error || "Failed to send notification." });
      }
    } catch (error) {
      setStatus({ type: "error", message: "A network error occurred." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Push Notifications</h2>
        <p className="text-secondary mt-2">Broadcast messages to all Hest users via the Relay API.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSend} className="glass p-8 rounded-3xl flex flex-col gap-6">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-2">
            <button
              type="button"
              onClick={() => setMode("broadcast")}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "broadcast" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              Broadcast All
            </button>
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "direct" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Direct Message
            </button>
          </div>

          {mode === "direct" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="user" className="text-sm font-medium text-foreground">Target User</label>
              <select
                id="user"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all appearance-none"
                required={mode === "direct"}
              >
                <option value="" disabled className="text-gray-500">Select a user...</option>
                {loadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : (
                  users.map(user => (
                    <option key={user.id} value={user.id} className="bg-[#0a0a0a]">
                      {user.name || user.displayName || "Anonymous"} ({user.email || user.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="title" className="text-sm font-medium text-foreground">Notification Title</label>
              <span className={`text-[10px] font-mono ${title.length > 26 ? 'text-red-400' : 'text-secondary'}`}>
                {title.length}/26
              </span>
            </div>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Feature Alert! ✨"
              required
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="body" className="text-sm font-medium text-foreground">Message Body</label>
              <span className={`text-[10px] font-mono ${body.length > 80 ? 'text-red-400' : 'text-secondary'}`}>
                {body.length}/80
              </span>
            </div>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              required
              rows={4}
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="mt-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSending ? "Sending..." : "Send Broadcast"}
          </button>

          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}
        </form>

        <div className="flex flex-col gap-6">
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Preview
            </h3>
            
            <div className="bg-[#0a0a0a5a] rounded-2xl p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                <Image src="/hest-thumbnail.png" alt="Hest" width={50} height={50} className="rounded-lg" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {title ? (title.length > 30 ? `${title.substring(0, 30)}...` : title) : "Notification Title"}
                  </h4>
                  <p className="text-xs text-secondary mt-1 leading-normal">
                    {body ? (body.length > 80 ? `${body.substring(0, 80)}...` : body) : "Your message body will appear here..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-accent" />
              Broadcasting Guidelines
            </h4>
            <ul className="text-xs text-secondary space-y-2 list-disc pl-4">
              <li>Notifications are sent to ALL registered devices.</li>
              <li>Keep titles short and punchy (under 26 characters).</li>
              <li>Avoid over-broadcasting to prevent user fatigue.</li>
              <li>Verify the content in the preview before sending.</li>
            </ul>
          </div>
        </div>
      </div>

      <hr className="border-white/5 my-8" />

      <DispatchesTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
