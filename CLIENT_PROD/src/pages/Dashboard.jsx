import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  Key,
  Mic,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import UploadPage from "./Upload";
import ApiKey from "./ApiKey";
import Result from "./Result";
import LiveAudio from "./LiveAudio";

import apiService from "../services/api";

export default function Dashboard() {
  const [tab, setTab] = useState("upload");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiService.signout();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  const menu = [
    {
      id: "upload",
      label: "Upload Audio",
      icon: Upload,
    },
    {
      id: "live",
      label: "Live Audio",
      icon: Mic,
    },
    {
      id: "apikey",
      label: "API Key",
      icon: Key,
    },
    {
      id: "results",
      label: "Results",
      icon: FileText,
    },
  ];

  const renderContent = () => {
    switch (tab) {
      case "upload":
        return <UploadPage />;

      case "live":
        return <LiveAudio />;

      case "apikey":
        return <ApiKey />;

      case "results":
        return <Result />;

      default:
        return <UploadPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-50 top-0 left-0 h-full w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="h-full flex flex-col">

          {/* TOP */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                🎙️
              </div>

              <div>
                <p className="font-bold text-gray-900">MeetingAI</p>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>

            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* NAV */}
          <nav className="flex-1 p-4 space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* BOTTOM */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </h1>

              <p className="text-sm text-gray-500">
                Manage uploads, API keys and live recording
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Online
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-140px)] overflow-hidden">
            {renderContent()}
          </div>
        </main>

      </div>
    </div>
  );
}