import { useState, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  X,
  AlertCircle,
  Binary,
  CheckCircle2,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { analysisClient } from '../services/apiClient';

interface BinaryLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBinaryLoaded: () => void;
}

export const BinaryLoaderModal: React.FC<BinaryLoaderModalProps> = ({
  isOpen,
  onClose,
  onBinaryLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'path' | 'upload'>('path');
  const [filePath, setFilePath] = useState('C:\\Windows\\System32\\whoami.exe');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleOpenPath = async (customPath?: string) => {
    const target = customPath || filePath;
    if (!target.trim()) {
      setError('Please provide a valid file path.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await analysisClient.openBinary(target);
      setSuccess(`Binary initialized successfully: ${target}`);
      setTimeout(() => {
        onBinaryLoaded();
        onClose();
      }, 1000);
    } catch (e: any) {
      setError(e?.message || 'Failed to open binary file via radare2');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await analysisClient.uploadBinary(selectedFile);
      setSuccess(`Uploaded and analyzed: ${selectedFile.name}`);
      setTimeout(() => {
        onBinaryLoaded();
        onClose();
      }, 1000);
    } catch (e: any) {
      setError(e?.message || 'Failed to upload and analyze binary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Load Target Binary</h3>
              <p className="text-[11px] text-slate-400">Open with real radare2 engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab('path')}
            className={`flex-1 py-2.5 text-center flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'path'
                ? 'border-purple-500 text-purple-300 font-bold bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Local Path
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 text-center flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-purple-500 text-purple-300 font-bold bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'path' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Absolute Path to Executable:
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="C:\Windows\System32\whoami.exe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Quick Presets:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[
                    'C:\\Windows\\System32\\whoami.exe',
                    'C:\\Windows\\System32\\cmd.exe',
                    'C:\\Windows\\System32\\calc.exe',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setFilePath(preset);
                        handleOpenPath(preset);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 transition-colors flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      {preset.split('\\').pop()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
              >
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select executable file'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports PE (.exe, .dll), ELF, Mach-O, Raw Binary
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => (activeTab === 'path' ? handleOpenPath() : handleUpload())}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Analyze in radare2</span>
          </button>
        </div>
      </div>
    </div>
  );
};
