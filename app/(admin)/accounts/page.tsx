"use client";

import { formatDate } from "@/lib/date-utils";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    Users,
    Building
} from "lucide-react";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Account {
  id: string;
  name?: string;
  createdAt?: { _seconds?: number; seconds?: number; nanoseconds?: number } | string | number | Date;
  status?: string;
  memberCount?: number;
}


export default function AccountsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountsPageContent />
    </Suspense>
  );
}

function AccountsPageContent() {
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get("accountId");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination state
  const cursorsRef = useRef<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchAccounts(0);
  }, []);

  useEffect(() => {
    if (urlAccountId) {
      fetchAccountDetails(urlAccountId);
    }
  }, [urlAccountId]);

  const fetchAccounts = async (pageIndex: number) => {
    setLoading(true);
    try {
      const cursor = cursorsRef.current[pageIndex];
      const res = await fetch(`/api/accounts?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`);
      const data = await res.json();
      
      if (data.items) {
        setAccounts(data.items);
        setHasMore(data.hasMore);
        
        if (data.lastVisible && pageIndex + 1 >= cursorsRef.current.length) {
          cursorsRef.current.push(data.lastVisible);
        }
        
        setCurrentPage(pageIndex);
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetails = async (id: string, locallySelected?: Account) => {
    setLoadingDetails(true);
    if (locallySelected && locallySelected.memberCount !== undefined) {
      setSelectedAccount(locallySelected);
      setLoadingDetails(false);
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${id}`);
      const data = await res.json();
        if (data.account) {
          setSelectedAccount(data.account);
          setAccounts(prev => prev.map(a => a.id === id ? data.account : a));
        }
    } catch (error) {
      console.error("Failed to fetch account details", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      fetchAccounts(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      fetchAccounts(currentPage - 1);
    }
  };

  const handleSelectAccount = (account: Account) => {
    if (selectedAccount?.id === account.id) return;
    // Update URL without full reload
    window.history.replaceState(null, '', `?accountId=${account.id}`);
    fetchAccountDetails(account.id, account);
  };

  const filteredAccounts = accounts.filter(account => 
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Account Management</h1>
          <p className="text-gray-400">View and manage household accounts in Hest.</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account List */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Account</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/5 rounded-full" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-white/5 rounded" />
                            <div className="h-3 w-48 bg-white/5 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-5 w-16 bg-white/5 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    </tr>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr 
                      key={account.id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedAccount?.id === account.id ? 'bg-white/5' : ''}`}
                      onClick={() => handleSelectAccount(account)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center min-w-[40px]">
                            <Building className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{account.name || "Unnamed Account"}</div>
                            <div className="text-sm text-gray-400">{account.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.status === "deactivated"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}>
                          {account.status === "deactivated" ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(account.createdAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing page {currentPage + 1}
            </span>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 disabled:opacity-50" 
                onClick={handlePrevPage}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 disabled:opacity-50" 
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-6">
          {selectedAccount ? (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 sticky top-6">
              {loadingDetails && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Building className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedAccount.name || "Unnamed Account"}</h2>
                  <p className="text-sm text-gray-400">Household</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Created {formatDate(selectedAccount.createdAt, "P")}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Building className="w-4 h-4" />
                  <span className="text-sm uppercase font-bold text-xs tracking-wider">{selectedAccount.id.substring(0, 12)}...</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Household Stats</h3>
                <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Account Members</div>
                      <div className="text-xs text-gray-500">Users belonging to this household</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white pr-2">
                    {selectedAccount.memberCount !== undefined ? selectedAccount.memberCount : "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel border-dashed border-2 border-white/5 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-400">No Account Selected</h3>
              <p className="text-sm text-gray-500 max-w-[200px] mt-2">
                Select an account from the list to view details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
