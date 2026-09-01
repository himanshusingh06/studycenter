import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import api, { getFileUrl } from '../../api/client';

const PhotoUploader = ({ value, onChange, label = "Student Photo" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setError('');

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be under 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>

      {value ? (
        <div className="relative w-40 h-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
          <img src={getFileUrl(value)} alt="Student Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
              title="Remove Photo"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${dragOver ? 'border-brand-400 bg-brand-500/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id="photo-upload-input"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          />
          <label htmlFor="photo-upload-input" className="cursor-pointer flex flex-col items-center space-y-2">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            ) : (
              <UploadCloud className="h-10 w-10 text-brand-400" />
            )}
            <div className="text-sm">
              <span className="font-semibold text-brand-400 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-slate-500">JPG, PNG or WEBP (Max 5MB)</p>
          </label>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-1.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
