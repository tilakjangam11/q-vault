import { motion } from 'framer-motion';
import { File, Download, Trash2, Clock, HardDrive, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FileList({ files, onDownload, onDelete, isDecryptedView }) {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (contentType) => {
        if (contentType?.startsWith('image/')) return '🖼️';
        if (contentType?.startsWith('video/')) return '🎥';
        if (contentType?.startsWith('audio/')) return '🎵';
        if (contentType?.includes('pdf')) return '📄';
        if (contentType?.includes('zip') || contentType?.includes('archive')) return '📦';
        return '📁';
    };

    if (!files || files.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-strong rounded-2xl p-12 text-center"
            >
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'var(--bg-tertiary)' }}
                >
                    <File className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    No encrypted files yet
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Upload your first file to get started with quantum-safe encryption
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-3">
            {files.map((file, index) => (
                <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl p-4 transition-all group border"
                    style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-4">
                        {/* File Icon */}
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: isDecryptedView ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)' }}
                        >
                            {getFileIcon(file.contentType)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {file.originalFilename}
                            </h3>
                            <div
                                className="flex items-center gap-3 mt-1 text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <span className="flex items-center gap-1">
                                    <HardDrive className="w-3 h-3" />
                                    {formatFileSize(file.fileSize)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(file.uploadedAt || file.decryptedAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>

                        {/* Actions - always visible on mobile, hover on desktop */}
                        <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {onDownload && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onDownload(file)}
                                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${isDecryptedView
                                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30'
                                            : 'bg-primary-500/20 hover:bg-primary-500/30'
                                        }`}
                                    title={isDecryptedView ? "Download File" : "Download & Decrypt"}
                                >
                                    <Download className={`w-4 h-4 ${isDecryptedView ? 'text-green-400' : 'text-primary-500'}`} />
                                    {isDecryptedView && (
                                        <span className="text-xs font-medium text-green-400 hidden sm:inline">Download</span>
                                    )}
                                </motion.button>
                            )}
                            {onDelete && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onDelete(file.id)}
                                    className={`p-2 rounded-lg transition-colors ${isDecryptedView
                                        ? 'bg-gray-500/20 hover:bg-gray-500/30'
                                        : 'bg-red-500/20 hover:bg-red-500/30'
                                        }`}
                                    title={isDecryptedView ? "Remove from workspace" : "Delete"}
                                >
                                    {isDecryptedView ? (
                                        <X className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
