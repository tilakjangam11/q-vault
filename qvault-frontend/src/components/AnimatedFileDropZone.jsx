import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function AnimatedFileDropZone({ onFileSelect, isUploading }) {
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0 && !isUploading) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect, isUploading]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled: isUploading,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
    });

    return (
        <motion.div
            {...getRootProps()}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragActive || isDragging
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 hover:border-primary-500/50'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ borderColor: isDragActive ? 'var(--accent-primary)' : 'var(--border-color)' }}
            whileHover={!isUploading ? { scale: 1.01 } : {}}
            whileTap={!isUploading ? { scale: 0.99 } : {}}
        >
            <input {...getInputProps()} />

            {/* Background Animation */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/5"
                    animate={{
                        opacity: isDragActive ? 1 : 0,
                    }}
                />

                {/* Floating particles */}
                <AnimatePresence>
                    {isDragActive && (
                        <>
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-primary-500/30 rounded-full"
                                    initial={{ opacity: 0, y: '100%', x: `${Math.random() * 100}%` }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        y: '-100%',
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="relative p-12 text-center">
                <motion.div
                    className="flex justify-center mb-6"
                    animate={{
                        y: isDragActive ? -10 : 0,
                    }}
                >
                    <div className="relative">
                        <motion.div
                            className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center"
                            animate={{
                                scale: isDragActive ? 1.1 : 1,
                            }}
                        >
                            {isDragActive ? (
                                <FileUp className="w-10 h-10 text-primary-500" />
                            ) : (
                                <Upload className="w-10 h-10 text-primary-500" />
                            )}
                        </motion.div>

                        {isDragActive && (
                            <motion.div
                                className="absolute -top-2 -right-2"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                            >
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <motion.h3
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                    animate={{
                        scale: isDragActive ? 1.05 : 1,
                    }}
                >
                    {isDragActive ? 'Drop to encrypt!' : 'Drop files to encrypt'}
                </motion.h3>

                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {isDragActive
                        ? 'Release to start quantum-safe encryption'
                        : 'or click to browse files'}
                </p>

                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>AES-256-GCM Encryption Ready</span>
                </div>
            </div>
        </motion.div>
    );
}
