import React, { useState } from 'react';
import { X, Key, Check, HelpCircle, ExternalLink } from 'lucide-react';

export default function ClientIdModal({ isOpen, onClose, clientId, onSaveClientId }) {
  const [inputVal, setInputVal] = useState(clientId || '');
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveClientId(inputVal.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-google-blue">
            <Key className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Google OAuth Client ID</h3>
            <p className="text-xs text-gray-500">Configure your Client ID to authorize live Drive scanning</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Google Cloud OAuth Client ID (Web Application)
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue focus:border-google-blue"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-google-blue hover:underline flex items-center space-x-1 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showInstructions ? 'Hide setup steps' : 'How to get a Client ID?'}</span>
            </button>
          </div>

          {/* Setup steps walkthrough */}
          {showInstructions && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 space-y-2">
              <div className="font-bold text-gray-900">3-Step Setup Guide:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-google-blue underline inline-flex items-center"
                  >
                    Google Cloud Credentials Console <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                </li>
                <li>Click <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong> &rarr; select <strong>Web application</strong>.</li>
                <li>Add <code>http://localhost:3000</code> to <strong>Authorized JavaScript origins</strong> and save.</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
