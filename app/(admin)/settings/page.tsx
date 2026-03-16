"use client";

import {
  ExternalLink,
  Globe,
  Key,
  RotateCcw,
  Save,
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    relayWebhookUrl: "",
    relaySecretKey: "",
    maintenanceMode: false,
    allowRegistrations: true,
    debugLogs: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully.");
      } else {
        alert("Failed to save settings.");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Settings</h1>
        <p className="text-gray-400">Manage global configurations and API integrations for the Hest Admin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configurations */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <span>API & Integrations</span>
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Relay API Webhook</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={settings.relayWebhookUrl} 
                  onChange={(e) => updateSetting("relayWebhookUrl", e.target.value)}
                  placeholder="https://your-relay-domain.com/path-to-relay"
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-white font-mono text-sm outline-none w-full focus:ring-2 focus:ring-indigo-500 focus:bg-white/10"
                />
                <a href={settings.relayWebhookUrl || "#"} target="_blank" rel="noreferrer" className="flex p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Relay Secret Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  autoComplete="off"
                  value={settings.relaySecretKey} 
                  onChange={(e) => updateSetting("relaySecretKey", e.target.value)}
                  placeholder={(settings as any).hasSecret ? "••••••••••••••••••••••••••••" : "Enter secret key..."}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10"
                />
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button 
                onClick={handleSave}
                disabled={loading || saving}
                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button 
                onClick={fetchSettings}
                disabled={loading || saving}
                className="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold transition-all flex items-center justify-center border border-white/10 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="glass-panel rounded-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <span>Global App Controls</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">Maintenance Mode</div>
                <div className="text-xs text-gray-500">Disable client-side writes temporarily</div>
              </div>
              <div 
                onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                className={`w-12 h-6 rounded-full relative cursor-pointer group transition-colors ${settings.maintenanceMode ? 'bg-indigo-500/20' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all ${settings.maintenanceMode ? 'bg-indigo-500 right-1' : 'bg-gray-600 left-1'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">New Registrations</div>
                <div className="text-xs text-gray-500">Allow new users to create accounts</div>
              </div>
              <div 
                onClick={() => updateSetting('allowRegistrations', !settings.allowRegistrations)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.allowRegistrations ? 'bg-indigo-500/20' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all ${settings.allowRegistrations ? 'bg-indigo-500 right-1' : 'bg-gray-600 left-1'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">Debug Logs</div>
                <div className="text-xs text-gray-500">Enable verbose logging in functions</div>
              </div>
              <div 
                onClick={() => updateSetting('debugLogs', !settings.debugLogs)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.debugLogs ? 'bg-indigo-500/20' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all ${settings.debugLogs ? 'bg-indigo-500 right-1' : 'bg-gray-600 left-1'}`} />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start space-x-3 text-amber-500">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Settings changed here affect the entire Hest ecosystem. Changes may take up to 60 seconds to propagate to all edge functions. Remember to save changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
