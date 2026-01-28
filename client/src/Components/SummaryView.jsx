import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FaWandMagicSparkles } from 'react-icons/fa6';

const SummaryView = ({ markdown }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 mb-12 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-purple-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-md">
                <FaWandMagicSparkles className="text-2xl text-yellow-300" />
            </div>
            <div>
                <h2 className="text-2xl font-bold">Résumé Intelligent</h2>
                <p className="text-purple-200 text-xs uppercase tracking-wide">Généré par IA</p>
            </div>
        </div>
        <div className="p-8 text-gray-700 leading-relaxed">
            <ReactMarkdown components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-900 mb-4 border-b pb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-6 bg-gray-50 p-6 rounded-lg" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
            }}>
                {markdown}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
export default SummaryView;