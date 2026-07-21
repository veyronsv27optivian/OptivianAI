import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, FileSpreadsheet, FileType, File,
  X, Loader2, CheckCircle, AlertCircle, ChevronRight,
  Download, Brain, Clock, Eye, Trash2,
} from 'lucide-react';
import { parseFile } from '../../services/ai/fileParser';
import { generateText } from '../../services/ai';

const SUPPORTED_TYPES = [
  { ext: '.pdf', label: 'PDF', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
  { ext: '.docx', label: 'Word', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { ext: '.xlsx', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { ext: '.xls', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { ext: '.csv', label: 'CSV', icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
  { ext: '.pptx', label: 'PowerPoint', icon: FileType, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const ACCEPT_STRING = SUPPORTED_TYPES.map(t => t.ext).join(',');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function BatchAnalyzer({ onClose }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [viewResult, setViewResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── File management ──────────────────────────────────────────

  const addFiles = useCallback(async (fileList) => {
    const newFiles = Array.from(fileList).filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return SUPPORTED_TYPES.some(t => t.ext === ext);
    });

    if (newFiles.length === 0) return;

    // Add files with parsing status
    const enriched = newFiles.map(f => ({
      file: f,
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      ext: '.' + f.name.split('.').pop()?.toLowerCase(),
      status: 'pending', // pending | parsing | parsed | error
      parsedContent: null,
      error: null,
      analysisStatus: 'waiting', // waiting | analyzing | done | error
      analysisResult: null,
      analysisError: null,
    }));

    setFiles(prev => [...prev, ...enriched]);

    // Auto-parse each file
    for (const entry of enriched) {
      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, status: 'parsing' } : f
      ));

      const result = await parseFile(entry.file);

      if (result.error) {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'error', error: result.error } : f
        ));
      } else {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'parsed', parsedContent: result.content } : f
        ));
      }
    }
  }, []);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setAnalyses([]);
    setViewResult(null);
  }, []);

  // ── Drag & drop handlers ────────────────────────────────────

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    if (e.target.files?.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }, [addFiles]);

  // ── Analysis engine ──────────────────────────────────────────

  const startAnalysis = useCallback(async () => {
    const toAnalyze = files.filter(f => f.status === 'parsed');
    if (toAnalyze.length === 0) return;

    setIsAnalyzing(true);
    const results = [];

    for (let i = 0; i < toAnalyze.length; i++) {
      const entry = toAnalyze[i];
      setCurrentIndex(i);

      // Mark as analyzing
      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, analysisStatus: 'analyzing' } : f
      ));

      try {
        const prompt = `I've uploaded a document titled "${entry.name}" for batch analysis. Here is the extracted content:\n\n---\n${entry.parsedContent.slice(0, 80000)}---\n\nPlease provide a concise analysis of this ${entry.ext.replace('.', '')} document. Include: 1) Key findings 2) Important data points 3) Recommendations.`;

        const result = await generateText('document_analyzer', prompt, {
          skipLogging: false,
          useCache: false,
        });

        const analysisEntry = {
          fileId: entry.id,
          fileName: entry.name,
          fileExt: entry.ext,
          content: result.text,
          provider: result.provider,
          model: result.modelUsed,
          timestamp: new Date().toLocaleTimeString(),
        };

        results.push(analysisEntry);

        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, analysisStatus: 'done', analysisResult: result.text } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, analysisStatus: 'error', analysisError: err.message } : f
        ));
      }
    }

    setAnalyses(prev => [...prev, ...results]);
    setCurrentIndex(-1);
    setIsAnalyzing(false);
  }, [files]);

  // ── Export all results ───────────────────────────────────────

  const exportAll = useCallback(() => {
    const text = analyses.map(a =>
      `=== ${a.fileName} ===\nTimestamp: ${a.timestamp}\nProvider: ${a.provider} (${a.model})\n\n${a.content}\n\n`
    ).join('---\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyses]);

  // ── Helpers ──────────────────────────────────────────────────

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeInfo = (ext) => SUPPORTED_TYPES.find(t => t.ext === ext);

  const statusCounts = {
    parsed: files.filter(f => f.status === 'parsed').length,
    pending: files.filter(f => f.status === 'pending').length,
    error: files.filter(f => f.status === 'error').length,
    analyzing: files.filter(f => f.analysisStatus === 'analyzing').length,
    done: files.filter(f => f.analysisStatus === 'done').length,
  };

  const parsedCount = statusCounts.parsed;
  const analyzedCount = statusCounts.done;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <Upload size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Batch Document Analysis</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Upload and analyze multiple documents at once
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analyses.length > 0 && (
            <button
              onClick={exportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Download size={14} />
              Export All
            </button>
          )}
          {files.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
        {/* ── Upload Drop Zone ── */}
        {files.length === 0 && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-200 group
              ${dragOver
                ? 'border-violet-400 bg-violet-50/50 shadow-lg shadow-violet-100'
                : 'border-slate-300 hover:border-violet-300 hover:bg-slate-50/50'
              }
            `}
          >
            <div className={`p-3 rounded-xl inline-block mb-4 transition-all ${
              dragOver ? 'bg-violet-100 scale-110' : 'bg-slate-100 group-hover:bg-violet-50'
            }`}>
              <Upload size={36} className={dragOver ? 'text-violet-600' : 'text-slate-500 dark:text-slate-400 group-hover:text-violet-500'} />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {dragOver ? 'Drop your files here' : 'Upload multiple documents'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Drag & drop files or click to browse — PDF, Word, Excel, CSV, PowerPoint
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUPPORTED_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <span key={t.ext} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${t.bg} ${t.color} text-xs font-medium`}>
                    <Icon size={12} />
                    {t.ext}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── File List ── */}
        {files.length > 0 && (
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({parsedCount} parsed, {statusCounts.error} errors)
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              >
                <Upload size={12} />
                Add More
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {files.map((entry) => {
                const typeInfo = getTypeInfo(entry.ext);
                const Icon = typeInfo?.icon || File;
                const statusIcon = () => {
                  if (entry.status === 'parsing') return <Loader2 size={14} className="animate-spin text-blue-500" />;
                  if (entry.status === 'error') return <AlertCircle size={14} className="text-red-500" />;
                  if (entry.status === 'parsed') {
                    if (entry.analysisStatus === 'analyzing') return <Loader2 size={14} className="animate-spin text-violet-500" />;
                    if (entry.analysisStatus === 'done') return <CheckCircle size={14} className="text-emerald-500" />;
                    if (entry.analysisStatus === 'error') return <AlertCircle size={14} className="text-red-500" />;
                    return <CheckCircle size={14} className="text-blue-400" />;
                  }
                  return <Clock size={14} className="text-slate-300" />;
                };

                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className={`p-1.5 rounded ${typeInfo?.bg || 'bg-slate-100'}`}>
                      <Icon size={14} className={typeInfo?.color || 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{entry.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatSize(entry.size)}</p>
                    </div>
                    {entry.error && (
                      <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={entry.error}>
                        {entry.error}
                      </span>
                    )}
                    <div className="shrink-0">{statusIcon()}</div>
                    {entry.analysisResult && (
                      <button
                        onClick={() => setViewResult(entry)}
                        className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all"
                        title="View result"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(entry.id)}
                      className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Analysis Controls ── */}
        {parsedCount > 0 && !isAnalyzing && analyzedCount < parsedCount && (
          <div className="flex justify-center">
            <button
              onClick={startAnalysis}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
            >
              <Brain size={18} />
              Analyze {parsedCount} Document{parsedCount !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* ── Analysis Progress ── */}
        {isAnalyzing && (
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 size={20} className="animate-spin text-violet-600" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Analyzing files... ({currentIndex + 1} of {parsedCount})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Processing each document through AI</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / parsedCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Results Summary ── */}
        {analyzedCount > 0 && (
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Analysis Complete
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full font-medium">
                {analyzedCount} document{analyzedCount !== 1 ? 's' : ''} analyzed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analyses.map((a, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const entry = files.find(f => f.id === a.fileId);
                    if (entry) setViewResult(entry);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700/30 hover:border-violet-200 dark:hover:border-violet-700/50 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all text-left"
                >
                  <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{a.fileName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{a.provider} · {a.timestamp}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* ── Result Detail Modal ── */}
      {viewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewResult(null)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-violet-500 shrink-0" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{viewResult.name || viewResult.fileName}</h3>
              </div>
              <button
                onClick={() => setViewResult(null)}
                className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            {/* Modal content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {viewResult.analysisResult || viewResult.content}
                </div>
              </div>
            </div>
            {/* Modal footer */}
            {viewResult.analysisResult && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {viewResult.provider} · {viewResult.model}
                </span>
                <button
                  onClick={() => {
                    const blob = new Blob([viewResult.analysisResult], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${viewResult.fileName || 'analysis'}-result.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
