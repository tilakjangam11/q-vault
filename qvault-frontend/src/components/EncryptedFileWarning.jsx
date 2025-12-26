import { motion } from 'framer-motion';
import { AlertTriangle, Lock, Download, X, FileX } from 'lucide-react';

export default function EncryptedFileWarning({ fileName, onDecrypt, onDownloadEncrypted, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="glass-strong rounded-2xl p-6 max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}

                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
                    File is Encrypted
                </h2>

                {/* Message */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                        <Lock className="w-4 h-4 inline mr-2" />
                        <strong>{fileName}</strong> is encrypted with AES-256-GCM and cannot be opened directly.
                    </p>
                </div>

                {/* Cannot Open Warning */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 justify-center">
                        <FileX className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-red-400 font-medium">
                            Encrypted files cannot be opened or played
                        </p>
                    </div>
                </div>

                {/* Info */}
                <p className="text-xs text-center mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Choose an option below:
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onDecrypt}
                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Lock className="w-5 h-5" />
                        Decrypt & Download (OTP Required)
                    </button>

                    <button
                        onClick={onDownloadEncrypted}
                        className="w-full py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download Encrypted File (.enc)
                    </button>
                </div>

                {/* Security Note */}
                <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>
                    🔐 OTP will be sent to your registered email for decryption
                </p>
            </motion.div>
        </motion.div>
    );
}
