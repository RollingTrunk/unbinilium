"use client";

import {
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  UserMinus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface UnverifiedUser {
  uid: string;
  email: string;
  createdAt: string;
}

interface OrphanedUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuditEvent {
  id: string;
  action: string;
  performedBy: string;
  targetId?: string;
  details?: Record<string, unknown>;
  timestamp: string | null;
}

interface SecurityMetrics {
  unverifiedUsers: UnverifiedUser[];
  orphanedUsers: OrphanedUser[];
  providerBreakdown: Record<string, number>;
  signupsByDay: Record<string, number>;
  recentAuditEvents: AuditEvent[];
  blockedDomains: string[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "user.deactivated": { label: "User Deactivated", color: "text-orange-400" },
  "user.reactivated": { label: "User Reactivated", color: "text-emerald-400" },
  "user.deleted": { label: "User Deleted", color: "text-red-400" },
  "cleanup.executed": { label: "Cleanup Run", color: "text-blue-400" },
  "blocklist.updated": { label: "Blocklist Updated", color: "text-purple-400" },
};

export default function SecurityPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Blocked domains local state
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainsSaving, setDomainsSaving] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security");
      const data = await res.json();
      setMetrics(data);
      setBlockedDomains(data.blockedDomains || []);
    } catch (error) {
      console.error("Failed to fetch security metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleAddDomain = () => {
    const domain = newDomain.toLowerCase().trim();
    if (!domain || blockedDomains.includes(domain)) {
      setNewDomain("");
      return;
    }
    setBlockedDomains(prev => [...prev, domain].sort());
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    setBlockedDomains(prev => prev.filter(d => d !== domain));
  };

  const handleSaveDomains = async () => {
    setDomainsSaving(true);
    try {
      const res = await fetch("/api/settings/blocked-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: blockedDomains }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Blocklist saved (${data.count} domains).`);
      } else {
        alert("Failed to save blocklist.");
      }
    } catch (error) {
      console.error("Failed to save blocklist:", error);
      alert("Error saving blocklist.");
    } finally {
      setDomainsSaving(false);
    }
  };

  const signupDays = metrics?.signupsByDay
    ? Object.entries(metrics.signupsByDay).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxSignups = signupDays.length > 0 ? Math.max(...signupDays.map(([, v]) => v)) : 1;

  const totalProviderUsers = metrics
    ? Object.values(metrics.providerBreakdown).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security Overview</h1>
          <p className="text-gray-400">Monitor account health, manage blocked domains, and review audit trail.</p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-medium transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Row 1: Unverified Users + Orphaned Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unverified Users List */}
        <div className={`glass-panel rounded-3xl border p-8 ${
          metrics && metrics.unverifiedUsers.length > 0 ? "border-orange-500/30" : "border-white/10"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShieldAlert className={`w-5 h-5 ${metrics && metrics.unverifiedUsers.length > 0 ? "text-orange-400" : "text-indigo-400"}`} />
              <span>Unverified Users</span>
            </h2>
            {metrics && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                metrics.unverifiedUsers.length > 0
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {metrics.unverifiedUsers.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-4">Password users who haven&apos;t verified email after 24 hours</p>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
            </div>
          ) : metrics && metrics.unverifiedUsers.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {metrics.unverifiedUsers.map((user) => (
                <Link
                  key={user.uid}
                  href={`/users?userId=${user.uid}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-gray-600">{user.uid.slice(0, 16)}…</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-3">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All clear — no stale unverified accounts</p>
            </div>
          )}
        </div>

        {/* Orphaned Users List */}
        <div className={`glass-panel rounded-3xl border p-8 ${
          metrics && metrics.orphanedUsers.length > 0 ? "border-amber-500/30" : "border-white/10"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UserMinus className={`w-5 h-5 ${metrics && metrics.orphanedUsers.length > 0 ? "text-amber-400" : "text-indigo-400"}`} />
              <span>Orphaned Users</span>
            </h2>
            {metrics && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                metrics.orphanedUsers.length > 0
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {metrics.orphanedUsers.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-4">Users with no household membership after 48 hours</p>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
            </div>
          ) : metrics && metrics.orphanedUsers.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {metrics.orphanedUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/users?userId=${user.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-3">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <UserMinus className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All clear — no orphaned accounts</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Blocked Domains + Provider Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked Email Domains */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Ban className="w-5 h-5 text-red-400" />
              <span>Blocked Domains</span>
            </h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
              {blockedDomains.length} domain{blockedDomains.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Domains blocked from signup in addition to the built-in disposable email list.
          </p>

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
              placeholder="e.g. spammydomain.com"
              className="flex-1 bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10"
            />
            <button
              onClick={handleAddDomain}
              disabled={!newDomain.trim()}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-all disabled:opacity-30 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {loading ? (
            <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ) : blockedDomains.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-sm">
              No custom blocked domains yet.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {blockedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center space-x-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono px-3 py-1.5 rounded-lg"
                >
                  <span>{domain}</span>
                  <button
                    onClick={() => handleRemoveDomain(domain)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveDomains}
              disabled={domainsSaving || loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{domainsSaving ? "Saving..." : "Save Blocklist"}</span>
            </button>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <span>Provider Breakdown</span>
          </h2>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          ) : metrics ? (
            <div className="space-y-3">
              {Object.entries(metrics.providerBreakdown)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([provider, count]) => {
                  const percentage = totalProviderUsers > 0
                    ? Math.round((count / totalProviderUsers) * 100)
                    : 0;
                  return (
                    <div key={provider} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium capitalize">
                          {provider === "google.com" ? "Google" : provider === "apple.com" ? "Apple" : provider}
                        </span>
                        <span className="text-gray-500">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500/60 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Row 3: Signup Trend + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Trend */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            <span>Signups (7 Days)</span>
          </h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="h-8 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : signupDays.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No signups in the last 7 days</p>
          ) : (
            <div className="space-y-2">
              {signupDays.map(([day, count]) => (
                <div key={day} className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 font-mono w-20 shrink-0">
                    {new Date(day + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-emerald-500/30 transition-all duration-500"
                      style={{ width: `${Math.max((count / maxSignups) * 100, 8)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center pl-2 text-xs font-bold text-emerald-400">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Audit Trail</span>
          </h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : metrics?.recentAuditEvents && metrics.recentAuditEvents.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {metrics.recentAuditEvents.map((event) => {
                const meta = ACTION_LABELS[event.action] || { label: event.action, color: "text-gray-400" };
                return (
                  <div key={event.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-start justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        {event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : "—"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      by {event.performedBy}
                      {event.targetId && <span className="text-gray-600"> • {event.targetId.slice(0, 12)}…</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No audit events yet</p>
              <p className="text-xs text-gray-600 mt-1">Events log when you take admin actions</p>
            </div>
          )}
        </div>
      </div>

      {/* Anomaly Banner */}
      {metrics && metrics.unverifiedUsers.length > 10 && (
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-orange-300">Elevated unverified accounts detected</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.unverifiedUsers.length} password accounts are older than 24 hours and still unverified.
              The daily cleanup cron should handle these automatically at 3:00 AM UTC.
              If this count persists, check the cron logs in Netlify.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
