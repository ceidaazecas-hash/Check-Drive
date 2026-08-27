import React, { useState } from 'react';
import { X, Key, Check, HelpCircle, ExternalLink, Copy, CheckCheck, ShieldAlert } from 'lucide-react';

export default function ClientIdModal({ isOpen, onClose, clientId, onSaveClientId }) {
  const [inputVal, setInputVal] = useState(clientId || '');
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveClientId(inputVal.trim());
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  const currentOrigin = window.location.origin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 relative max-h-[92vh] overflow-y-auto">
        
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
            <h3 className="text-lg font-bold text-gray-900">Google OAuth Setup</h3>
            <p className="text-xs text-gray-500">Configure your Client ID & authorize website domain</p>
          </div>
        </div>

        {/* Crucial Authorized Origins Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs">
          <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Fix "Error 400: origin_mismatch" (Allow Account Switching)</span>
          </div>
          <p className="text-amber-800 text-[11px] mb-2">
            In Google Cloud Console, you <strong>must add this website URL</strong> to <strong>Authorized JavaScript origins</strong>:
          </p>
          
          <div className="flex items-center justify-between bg-white border border-amber-300 rounded-lg p-2 font-mono text-[11px] text-gray-800 mb-2">
            <span className="truncate">{currentOrigin}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(currentOrigin)}
              className="ml-2 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              {copiedUrl === currentOrigin ? <CheckCheck className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl === currentOrigin ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          
          <div className="text-[10px] text-amber-700">
            Once added in Google Cloud Console, Google will open the <strong>Account Chooser</strong> window so you can select your school account!
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              OAuth Client ID
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 973292062953-al17...apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue focus:border-google-blue font-mono"
            />
          </div>

          {/* Setup steps walkthrough */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 space-y-1.5">
            <div className="font-bold text-gray-900">Direct Link to Google Cloud Console:</div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-google-blue font-bold underline inline-flex items-center gap-1"
            >
              Open Google Cloud Credentials Console <ExternalLink className="w-3 h-3" />
            </a>
            <ol className="list-decimal list-inside space-y-1 mt-1 text-[10px] text-gray-500">
              <li>Click your <strong>Web client 1</strong> (OAuth Client ID).</li>
              <li>Under <strong>Authorized JavaScript origins</strong>, click <strong>+ ADD URI</strong>.</li>
              <li>Paste <code>{currentOrigin}</code> and click <strong>SAVE</strong>.</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Client ID</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
