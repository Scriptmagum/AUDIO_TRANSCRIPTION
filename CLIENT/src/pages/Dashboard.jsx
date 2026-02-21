import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Upload, 
  Key, 
  Clock, 
  ChevronRight,
  FileText,
  Download,
  Copy,
  Check
} from "lucide-react";

import Button from "../components/ui/Button";
import FileUploader from "../components/features/FileUploader";

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMTIzNDU2Nzg5MCJ9...";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <span className="font-semibold text-gray-900">MeetingAI</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Welcome back,</span>
              <span className="font-medium text-gray-900">John Doe</span>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Manage your transcriptions and API keys</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - API Key & Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* API Key Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Key size={20} className="text-purple-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Your API Token</h2>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs text-gray-600 break-all">{apiToken}</code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 transition"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <Link
                    to="/apikey"
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                  >
                    Regenerate
                  </Link>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Use this token in your API requests. Keep it secure.
              </p>
            </div>

            {/* Quick Upload Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload size={20} className="text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Quick Upload</h2>
              </div>
              
              <FileUploader />
              
              <Link
                to="/upload"
                className="mt-4 flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 transition"
              >
                Advanced options
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Column - Recent Transcriptions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent transcriptions</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            Team Sync - March {15 + item}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">2 hours ago</span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock size={14} />
                              24 min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Completed
                        </span>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <Download size={18} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="mt-3 ml-14">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        "Welcome everyone to today's meeting. Let's discuss the Q2 roadmap and 
                        upcoming features. First on the agenda..."
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}