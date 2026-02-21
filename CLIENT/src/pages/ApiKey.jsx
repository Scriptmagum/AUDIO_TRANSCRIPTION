import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Key, 
  Copy, 
  Check, 
  RefreshCw,
  AlertCircle,
  Loader
} from "lucide-react";
import apiService from "../services/api";

export default function ApiKey() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [uuid, setUuid] = useState('');
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing token if available
    const existingToken = localStorage.getItem('api_token');
    const existingUuid = localStorage.getItem('user_uuid');
    if (existingToken && existingUuid) {
      setApiKey(existingToken);
      setUuid(existingUuid);
    }
  }, []);

  const handleGenerateToken = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.generateToken();
      setApiKey(data.token);
      setUuid(data.uuid);
    } catch (err) {
      setError('Failed to generate token. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">API Token</h1>
              <p className="text-sm text-gray-500">Generate and manage your API token</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {apiKey ? 'Your API Token' : 'Generate Your API Token'}
              </h2>
              <p className="text-gray-500">
                {apiKey 
                  ? 'Use this token to authenticate your API requests' 
                  : 'Get started by generating a unique API token'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!apiKey ? (
              <button
                onClick={handleGenerateToken}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    Generate New Token
                  </>
                )}
              </button>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">YOUR TOKEN</span>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <code className="text-sm text-gray-800 break-all font-mono bg-white p-3 rounded border border-gray-200 block">
                    {showKey ? apiKey : '•'.repeat(50)}
                  </code>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <span className="text-xs font-medium text-gray-500">USER UUID</span>
                  <code className="text-sm text-gray-600 block mt-1 font-mono">
                    {uuid}
                  </code>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 transition"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Token'}
                  </button>
                  <button
                    onClick={handleGenerateToken}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 text-sm mb-1">Important</h4>
                      <p className="text-xs text-yellow-700">
                        This token is stored locally and will be used for all API requests. 
                        Keep it secure and never share it publicly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/upload"
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    Proceed to upload your first audio file →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}