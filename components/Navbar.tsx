"use client";

import { Bell, Search, User } from "lucide-react";

export default function Navbar() {
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

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground leading-none">Admin User</p>
            <p className="text-[10px] text-secondary mt-1">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
