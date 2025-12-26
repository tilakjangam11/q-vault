import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Key, CheckCircle2 } from 'lucide-react';

export default function EncryptionProgress({ progress, status, fileName }) {
    const getStatusMessage = () => {
        if (progress < 30) return 'Generating secure key...';
        if (progress < 60) return 'Encrypting file...';
        if (progress < 90) return 'Finalizing encryption...';
        return 'Encryption complete!';
    };

    const getIcon = () => {
        if (progress < 30) return <Key className="w-8 h-8 text-primary-500 animate-pulse" />;
        if (progress < 90) return <Lock className="w-8 h-8 text-primary-500 animate-spin" />;
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="encryption-progress-modal"
            >
                <div className="glass-strong rounded-2xl p-8 max-w-md w-full">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <motion.div
                            key={progress}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center"
                        >
                            {getIcon()}
                        </motion.div>
                    </div>

                    {/* File Name */}
                    <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
                        {fileName}
                    </h3>

                    {/* Status Message */}
                    <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {status || getStatusMessage()}
                    </p>

                    {/* Progress Bar */}
                    <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />

                        {/* Shimmer effect */}
                        <motion.div
                            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                                x: ['-100%', '200%']
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                        />
                    </div>

                    {/* Percentage */}
                    <div className="text-center">
                        <span className="text-2xl font-bold text-primary-500">{progress}%</span>
                    </div>

                    {/* Security Notice */}
                    {progress === 100 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                        >
                            <p className="text-sm text-green-400 text-center">
                                <Shield className="w-4 h-4 inline mr-2" />
                                File is now encrypted and secure
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
