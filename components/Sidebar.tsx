"use client";

import {
    Bell,
    Building,
    Database,
    LayoutDashboard,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Accounts", href: "/accounts", icon: Building },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Cleanup", href: "/cleanup", icon: Database },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`w-64 glass h-screen fixed left-0 top-0 p-4 flex flex-col gap-8 transition-all duration-300 z-40 
      ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Image src="/hest.png" alt="Hest Logo" className="rounded" width={32} height={32} />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Hest Admin</h1>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden p-2 hover:bg-white/5 rounded-lg text-secondary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-secondary hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-secondary group-hover:text-primary"}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-2 mt-auto">
        <div className="glass rounded-xl p-4 text-xs text-secondary">
          <p className="font-semibold text-foreground mb-1 capitalize">{process.env.NODE_ENV || "Live"}</p>
          <p>Connected to {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        </div>
      </div>
    </aside>
  );
}
