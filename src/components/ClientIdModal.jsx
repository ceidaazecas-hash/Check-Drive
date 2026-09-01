import React, { useState } from 'react';

export default function ClientIdModal({ isOpen, onClose, clientId, onSaveClientId }) {
  const [inputVal, setInputVal] = useState(clientId || '');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative max-h-[92vh] overflow-y-auto border-0 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border-0 font-bold"
        >
          &times;
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-black text-gray-900">Google OAuth Setup</h3>
          <p className="text-xs text-gray-500 mt-0.5">Configure your Client ID & authorize website domain</p>
        </div>

        {/* Authorized Origins Info */}
        <div className="bg-amber-50 rounded-2xl p-4 mb-4 text-xs border-0">
          <div className="font-black text-amber-900 mb-1">
            Fix "Error 400: origin_mismatch" (Allow Account Switching)
          </div>
          <p className="text-amber-800 text-[11px] mb-2">
            In Google Cloud Console, add this website URL to <strong>Authorized JavaScript origins</strong>:
          </p>
          
          <div className="flex items-center justify-between bg-white rounded-xl p-2.5 font-mono text-[11px] text-gray-800 mb-2 border-0 shadow-2xs">
            <span className="truncate">{currentOrigin}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(currentOrigin)}
              className="ml-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black shrink-0 border-0"
            >
              {copiedUrl === currentOrigin ? 'Copied' : 'Copy'}
            </button>
          </div>
          
          <div className="text-[10px] text-amber-700">
            Once added, Google opens the <strong>Account Chooser</strong> window so you can select your school account!
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              OAuth Client ID
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 973292062953-al17...apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 bg-gray-100 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue font-mono border-0 font-medium"
            />
          </div>

          {/* Setup steps walkthrough */}
          <div className="bg-gray-50 rounded-2xl p-3.5 text-[11px] text-gray-600 space-y-1.5 border-0">
            <div className="font-bold text-gray-900">Direct Link to Google Cloud Console:</div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-google-blue font-bold underline block"
            >
              Open Google Cloud Credentials Console
            </a>
            <ol className="list-decimal list-inside space-y-1 mt-1 text-[10px] text-gray-500">
              <li>Click your <strong>Web client 1</strong> (OAuth Client ID).</li>
              <li>Under <strong>Authorized JavaScript origins</strong>, click <strong>+ ADD URI</strong>.</li>
              <li>Paste <code>{currentOrigin}</code> and click <strong>SAVE</strong>.</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold border-0"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-black shadow-xs border-0"
            >
              Save Client ID
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
