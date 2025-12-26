import { motion } from 'framer-motion';
import { CheckCircle2, FolderLock, ArrowRight } from 'lucide-react';

export default function FileEncryptionAnimation({ fileName, onComplete }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="glass-strong rounded-2xl p-8 max-w-md w-full">
                <div className="text-center">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                    </motion.div>

                    {/* Success Message */}
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        File Encrypted Successfully!
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm mb-6"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {fileName}
                    </motion.p>

                    {/* Animation: File moving to encrypted folder */}
                    <div className="relative h-32 mb-6">
                        <div className="absolute inset-0 flex items-center justify-between px-8">
                            {/* File Icon */}
                            <motion.div
                                initial={{ x: 0, opacity: 1 }}
                                animate={{ x: 120, opacity: 0 }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center"
                            >
                                <span className="text-2xl">📄</span>
                            </motion.div>

                            {/* Arrow */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <ArrowRight className="w-8 h-8 text-primary-500" />
                            </motion.div>

                            {/* Encrypted Folder */}
                            <motion.div
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ delay: 1.2, duration: 0.5 }}
                                className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center"
                            >
                                <FolderLock className="w-8 h-8 text-green-500" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6"
                    >
                        <p className="text-sm text-green-400">
                            🔒 File is now encrypted and stored securely
                        </p>
                    </motion.div>

                    {/* Done Button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        onClick={onComplete}
                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        Done
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
