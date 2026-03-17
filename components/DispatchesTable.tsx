"use client";

import { formatDate, type FirestoreTimestamp } from "@/lib/date-utils";
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History, 
  User, 
  Users, 
  Loader2
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import type { NotificationDispatch as Dispatch } from "@/lib/types/notifications";

export function DispatchesTable({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Pagination state
  const cursorsRef = useRef<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchDispatches = async (pageIndex: number) => {
    setLoading(true);
    try {
      const cursor = cursorsRef.current[pageIndex];
      const res = await fetch(`/api/notifications/dispatches?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`);
      const data = await res.json();
      
      if (data.dispatches) {
        setDispatches(data.dispatches);
        setHasMore(data.hasMore);
        
        if (data.lastVisible && pageIndex + 1 >= cursorsRef.current.length) {
          cursorsRef.current.push(data.lastVisible);
        }
        
        setCurrentPage(pageIndex);
      }
    } catch (error) {
      console.error("Failed to fetch dispatches", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to first page on refresh trigger
    cursorsRef.current = [null];
    fetchDispatches(0);
  }, [refreshTrigger]);

  const handleNextPage = () => {
    if (hasMore) {
      fetchDispatches(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      fetchDispatches(currentPage - 1);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-2">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Dispatch History</h3>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondary">Sent At</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondary">Admin Email</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondary">To</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondary">Message</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondary">Reach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-6 bg-white/5 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary italic">
                    No notification dispatches found.
                  </td>
                </tr>
              ) : (
                dispatches.map((dispatch) => (
                  <React.Fragment key={dispatch.id}>
                    <tr 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${expandedId === dispatch.id ? "bg-white/5" : ""}`}
                      onClick={() => toggleExpand(dispatch.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(dispatch.timestamp, "MMM d, h:mm a")}
                          </span>
                          <span className="text-[10px] text-secondary">
                            {formatDate(dispatch.timestamp, "yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground truncate max-w-[180px]" title={dispatch.adminEmail}>
                            {dispatch.adminEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dispatch.type === "broadcast" ? (
                            <>
                              <Users className="w-4 h-4 text-accent" />
                              <span className="text-xs font-medium text-accent uppercase tracking-wider">Broadcast</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-indigo-400" />
                              <span className="text-xs text-foreground truncate max-w-[180px]" title={dispatch.recipientEmail || dispatch.recipientId || ""}>
                                {dispatch.recipientEmail || (dispatch.recipientId ? `${dispatch.recipientId.substring(0, 8)}...` : "Unknown")}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-1 max-w-xs">
                            <span className="text-sm font-semibold text-foreground truncate" title={dispatch.title}>
                              {dispatch.title}
                            </span>
                            <span className="text-xs text-secondary line-clamp-1">
                              {dispatch.body}
                            </span>
                          </div>
                          {expandedId === dispatch.id ? (
                            <ChevronUp className="w-4 h-4 text-secondary flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-secondary flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dispatch.sentCount > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {dispatch.sentCount} recipients
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedId === dispatch.id && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={5} className="px-6 py-6 border-l-2 border-primary/50">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">Notification Title</h4>
                              <p className="text-lg font-bold text-foreground">{dispatch.title}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">Message Body</h4>
                              <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{dispatch.body}</p>
                            </div>
                            <div className="mt-2 pt-4 border-t border-white/5 flex gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-secondary uppercase font-bold">Admin ID</span>
                                    <span className="text-xs font-mono text-foreground/70">{dispatch.id}</span>
                                </div>
                                {dispatch.recipientId && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-secondary uppercase font-bold">Recipient ID</span>
                                        <span className="text-xs font-mono text-foreground/70">{dispatch.recipientId}</span>
                                    </div>
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-secondary">
            <span>Page {currentPage + 1}</span>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || loading}
              className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className="p-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
