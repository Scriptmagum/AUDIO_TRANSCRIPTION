import React from 'react';

const TranscriptionView = ({ text }) => {
  const lines = text.split('\n').filter(line => line.trim() !== "");

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-700">📝 Transcription détaillée</h3>
            <span className="text-xs font-mono text-gray-400">{lines.length} échanges</span>
        </div>
        <div className="p-6 flex flex-col gap-4 max-h-[500px] overflow-y-auto bg-slate-50">
          {lines.map((line, index) => {
            const parts = line.split(':');
            const speaker = parts[0]; 
            const message = parts.slice(1).join(':');
            const isMe = speaker.includes("SPEAKER_00") || speaker.includes("00");

            return (
              <div key={index} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 px-1">{speaker || "Inconnu"}</span>
                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-700 border border-gray-200 rounded-tl-none"}`}>
                  {message}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TranscriptionView;