"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const displayEmail = user?.email ?? "admin";

  return (
    <header className="h-16 glass sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 flex items-center gap-4 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search users, records, or logs..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-secondary hover:text-foreground transition-colors p-2 rounded-lg hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

        {/* Admin dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-2 cursor-pointer rounded-xl py-1.5 pr-2 hover:bg-white/5 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground leading-none">Admin User</p>
              <p className="text-[10px] text-secondary mt-1 max-w-[160px] truncate">{displayEmail}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-secondary transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-lg shadow-black/30 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs text-secondary">Signed in as</p>
                <p className="text-sm text-foreground font-medium truncate mt-0.5">{displayEmail}</p>
              </div>
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
