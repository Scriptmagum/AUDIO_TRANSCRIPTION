import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Download, 
  Copy, 
  Check, 
  ArrowLeft,
  Loader,
  AlertCircle
} from "lucide-react";
import apiService from "../services/api";

export default function Result() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/apikey');
      return;
    }

    fetchResult();
  }, [navigate]);

  const fetchResult = async () => {
    try {
      const data = await apiService.getResult();
      if (data) {
        setResult(data);
        setLoading(false);
      } else {
        // No result yet, poll again after 3 seconds
        setTimeout(fetchResult, 3000);
      }
    } catch (err) {
      setError('Failed to fetch results');
      setLoading(false);
    }
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(result?.transcript || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    try {
      await apiService.downloadPdf();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your audio</h2>
          <p className="text-gray-500">This may take a minute or two...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error || 'No results found'}</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/upload" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transcription Result</h1>
              <p className="text-sm text-gray-500">Meeting ID: {result.uuid}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={handleCopyTranscript}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "transcript"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "summary"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                AI Summary
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {activeTab === "transcript" ? result.transcript : 'Summary feature coming soon...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}