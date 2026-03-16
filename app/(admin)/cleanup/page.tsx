"use client";

import {
    AlertTriangle,
    BarChart2,
    CheckCircle2,
    Clock,
    Database,
    FileText,
    RefreshCw,
    Trash2,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface CleanupReport {
  orphanedMembers: number;
  orphanedRecords: number;
  orphanedHistory: number;
  totalToCleanup: number;
}

export default function CleanupPage() {
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cleanup");
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch cleanup report", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!confirm("Are you sure you want to delete all identified orphaned records? This action cannot be undone.")) return;
    
    setRunning(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/cleanup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Successfully cleaned up ${data.cleanedCount} records.`);
        fetchReport();
      }
    } catch (error) {
      console.error("Cleanup failed", error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Data Cleanup Utility</h1>
        <p className="text-gray-400">Identify and remove orphaned data across the Hest ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Orphaned Records Report</span>
            </h2>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-white/5 rounded-2xl w-full" />
                <div className="h-12 bg-white/5 rounded-2xl w-full" />
                <div className="h-12 bg-white/5 rounded-2xl w-full" />
              </div>
            ) : report ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">Orphaned Memberships</span>
                  </div>
                  <span className="text-xl font-bold text-white">{report.orphanedMembers}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">Orphaned Records</span>
                  </div>
                  <span className="text-xl font-bold text-white">{report.orphanedRecords}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">History Log Cleanup</span>
                  </div>
                  <span className="text-xl font-bold text-white">{report.orphanedHistory}</span>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500 uppercase font-bold tracking-wider">Total Orphaned</span>
                    <div className="text-3xl font-black text-indigo-400 mt-1">{report.totalToCleanup}</div>
                  </div>
                  <button 
                    disabled={running || report.totalToCleanup === 0}
                    onClick={handleRunCleanup}
                    className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
                  >
                    {running ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    <span>{running ? "Executing..." : "Run System Cleanup"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Failed to load report.</div>
            )}
          </div>

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>Cleanup Scopes</span>
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                <span>Removing entries from 0000000000000 that point to deleted accounts.</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                <span>Purging historical activity logs for records no longer in the system.</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                <span>Cleaning up notification settings for users who have been deleted.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-300 uppercase tracking-tight">Warning</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  System cleanup deletes documents permanently. It is recommended to run a manual backup of the Firestore database before performing massive purges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
