import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";

import { admin, adminDb } from "@/lib/firebase-admin";

export default async function Home() {
  const usersSnapshot = await adminDb.collection("users").get();
  const totalUsers = usersSnapshot.size;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const activeUsersSnapshot = await adminDb.collection("users")
    .where("lastLogin", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .get();
  const activeThisWeek = activeUsersSnapshot.size;

  const newUsersSnapshot = await adminDb.collection("users")
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .get();
  const newUsers = newUsersSnapshot.size;

  const stats = [
    { name: "Total Users", value: totalUsers.toLocaleString(), icon: Users, change: "Live", trend: "up" },
    { name: "Active This Week", value: activeThisWeek.toLocaleString(), icon: UserCheck, change: "7 Days", trend: "up" },
    { name: "New Users", value: newUsers.toLocaleString(), icon: UserPlus, change: "7 Days", trend: "up" },
    { name: "Push Sent", value: "N/A", icon: Bell, change: "--", trend: "up" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-secondary mt-2">Welcome back to the Hest administrative control center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass p-6 rounded-3xl hover-glow transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <p className="text-secondary text-sm font-medium">{stat.name}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Activity
            </h3>
            <button className="text-primary text-sm font-medium hover:underline">View All</button>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Weekly Review Broadcast Sent</p>
                  <p className="text-xs text-secondary mt-1">To 1,842 recipients in "Hest Production"</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">2h ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-8">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
              <Bell className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Send Notification</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group">
              <Database className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Run Cleanup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
