import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Check, Loader } from "lucide-react";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    // Simulate upload
    handleUpload(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    maxFiles: 1
  });

  const handleUpload = (file) => {
    setUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setUploadComplete(true);
      }
    }, 300);
  };

  const removeFile = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setUploadComplete(false);
  };

  if (!file) {
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
            ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Upload size={20} className={isDragActive ? 'text-blue-600' : 'text-gray-600'} />
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-400">
            Supports MP3, WAV, M4A (max 100MB)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <File size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={removeFile}
          className="p-1 hover:bg-gray-200 rounded-lg transition"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadComplete && (
        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
          <Check size={16} />
          <span>Upload complete! Processing your file...</span>
        </div>
      )}
    </div>
  );
}