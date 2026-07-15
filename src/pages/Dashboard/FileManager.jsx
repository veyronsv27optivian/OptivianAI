import { useState, useMemo } from 'react';
import {
  Folder, File, FileText, FileSpreadsheet, FileType,
  Image, Download, Trash2, Upload, Search, X,
  Grid3X3, List, ChevronRight, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Sample file data ─────────────────────────────────────────────
function getSampleFiles() {
  try {
    return JSON.parse(localStorage.getItem('optivian_file_manager') || '[]');
  } catch { return []; }
}

function saveSampleFiles(files) {
  localStorage.setItem('optivian_file_manager', JSON.stringify(files));
}

const FILE_ICONS = {
  pdf: FileText, docx: FileText, doc: FileText,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet, csv: FileSpreadsheet,
  pptx: FileType, ppt: FileType,
  png: Image, jpg: Image, jpeg: Image, gif: Image, svg: Image, webp: Image,
  mp4: FileType, mp3: FileType, zip: FileType,
};

function getFileIcon(ext) { return FILE_ICONS[ext] || File; }
function getFileColor(ext) {
  const colors = {
    pdf: 'text-red-600', docx: 'text-blue-600', xlsx: 'text-emerald-600',
    csv: 'text-green-600', pptx: 'text-orange-600', png: 'text-purple-600',
    jpg: 'text-purple-600', jpeg: 'text-purple-600',
  };
  return colors[ext] || 'text-slate-500';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FileManager({ onClose }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState(getSampleFiles);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');

  const filtered = useMemo(() => {
    return files.filter(f => {
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedFolder === 'recent') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return new Date(f.created_at || f.uploaded_at).getTime() > sevenDaysAgo;
      }
      return true;
    });
  }, [files, searchQuery, selectedFolder]);

  const handleDelete = (id) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    saveSampleFiles(updated);
  };

  const folders = [
    { id: 'all', label: 'All Files', icon: Folder },
    { id: 'recent', label: 'Recent', icon: ChevronDown },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'spreadsheets', label: 'Spreadsheets', icon: FileSpreadsheet },
    { id: 'images', label: 'Images', icon: Image },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-slate-200 dark:border-slate-700/50 p-3 space-y-1 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
        {folders.map(f => {
          const FIcon = f.icon;
          return (
            <button key={f.id} onClick={() => setSelectedFolder(f.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedFolder === f.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FIcon size={16} />
              {f.label}
            </button>
          );
        })}
        <div className="border-t border-slate-200 dark:border-slate-700/50 my-2 pt-2">
          <p className="text-[10px] text-slate-400 px-3 mb-1 uppercase tracking-wider">Storage</p>
          <div className="px-3">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '23%' }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">23 MB of 100 MB used</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <Grid3X3 size={14} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded text-xs ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
                <List size={14} />
              </button>
            </div>
            <button onClick={onClose || (() => navigate('/app/settings'))} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* File grid/list */}
        <div className="flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Upload size={40} className="text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No files found</p>
              <p className="text-xs text-slate-400 mt-1">Files you upload or attach to tasks will appear here</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(f => {
                const FI = getFileIcon(f.type || f.ext);
                return (
                  <div key={f.id} className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="flex justify-center mb-3">
                      <FI size={36} className={getFileColor(f.type || f.ext)} />
                    </div>
                    <p className="text-xs text-center font-medium text-slate-700 truncate">{f.name}</p>
                    <p className="text-[10px] text-center text-slate-400 mt-0.5">{formatSize(f.size)}</p>
                    <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Download"><Download size={12} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-3">Uploaded</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filtered.map(f => {
                const FI = getFileIcon(f.type || f.ext);
                return (
                  <div key={f.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 items-center">
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <FI size={16} className={`shrink-0 ${getFileColor(f.type || f.ext)}`} />
                      <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    </div>
                    <div className="col-span-2 text-xs text-slate-500">{formatSize(f.size)}</div>
                    <div className="col-span-3 text-xs text-slate-400">{formatDate(f.created_at || f.uploaded_at)}</div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Download"><Download size={12} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
