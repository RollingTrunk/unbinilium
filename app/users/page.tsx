"use client";

import { format } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  MoreVertical,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Unlock,
  User as UserIcon,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  lastLogin?: any;
  status?: "active" | "deactivated";
  role?: "user" | "admin";
}

const formatDate = (dateObj: any, formatStr: string) => {
  if (!dateObj) return "Unknown";
  try {
    const d = dateObj._seconds ? new Date(dateObj._seconds * 1000) : 
              dateObj.seconds ? new Date(dateObj.seconds * 1000) : 
              new Date(dateObj);
    if (isNaN(d.getTime())) return "Unknown";
    return format(d, formatStr);
  } catch (e) {
    return "Unknown";
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users?limit=20");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === 'deactivated' ? 'active' : 'deactivated';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'reactivate' : 'deactivate'} this user?`)) return;
    
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedUser({ ...selectedUser, status: newStatus });
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/impersonate`, { method: 'POST' });
      const data = await res.json();
      
      if (data.token) {
        const webUrl = process.env.NEXT_PUBLIC_EXPO_WEB_URL || 'https://hest-server.web.app';
        window.open(`${webUrl}/?token=${data.token}`, '_blank');
      } else {
        alert("Failed to generate impersonation token. Make sure the service account is configured.");
      }
    } catch (err) {
      console.error("Impersonation error:", err);
      alert("An error occurred during impersonation.");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to PERMANENTLY delete this user and their core data? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Management</h1>
          <p className="text-gray-400">View and manage users registered in Hest.</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
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
                      <td className="px-6 py-4"><div className="ml-auto h-8 w-8 bg-white/5 rounded-lg" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-white/5' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-indigo-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{user.name || user.displayName || "Anonymous"}</div>
                            <div className="text-sm text-gray-400">{user.email || user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "deactivated" 
                            ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}>
                          {user.status === "deactivated" ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(user.createdAt, "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {filteredUsers.length} users</span>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* User Details / Actions */}
        <div className="space-y-6">
          {selectedUser ? (
            <div className="glass-panel rounded-3xl border border-white/10 p-6 sticky top-6">
              <div className="flex items-center space-x-4 mb-6">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-2xl border border-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedUser.name || selectedUser.displayName || "Anonymous"}</h2>
                  <p className="text-sm text-gray-400">{selectedUser.role === 'admin' ? 'Administrator' : 'General User'}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{selectedUser.email || "No email"}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {formatDate(selectedUser.createdAt, "P")}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm uppercase font-bold text-xs tracking-wider">{selectedUser.id.substring(0, 12)}...</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Management Actions</h3>
                
                <button 
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  onClick={handleToggleStatus}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                      {selectedUser.status === "deactivated" ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {selectedUser.status === "deactivated" ? "Reactivate Account" : "Deactivate Account"}
                      </div>
                      <div className="text-xs text-gray-500">Prevent user from logging in</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>

                <button 
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-all group"
                  onClick={handleImpersonate}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white text-purple-300">Impersonate User</div>
                      <div className="text-xs text-gray-500">Experience the app as this user</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>

                <button 
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group"
                  onClick={handleDelete}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white text-red-400">Delete User Data</div>
                      <div className="text-xs text-gray-500">Wipe all records and account</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Admin Context</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                      Deletion is permanent and will remove associated household records, tasks, and media. Proceed with caution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel border-dashed border-2 border-white/5 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-400">No User Selected</h3>
              <p className="text-sm text-gray-500 max-w-[200px] mt-2">
                Select a user from the list to view details and perform actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
