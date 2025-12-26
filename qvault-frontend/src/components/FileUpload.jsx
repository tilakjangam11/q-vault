import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, Loader2, CheckCircle2 } from 'lucide-react';
import { fileService } from '../services/fileService';
import OTPModal from './OTPModal';
import toast from 'react-hot-toast';

export default function FileUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setShowOTPModal(true);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setShowOTPModal(true);
        }
    };

    const handleUpload = async (otp) => {
        if (!file) return;

        setUploading(true);
        try {
            await fileService.uploadFile(file, otp);
            toast.success('File encrypted and uploaded successfully!');
            setFile(null);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl p-6"
            >
                <h2 className="text-xl font-bold text-white mb-4">Upload & Encrypt File</h2>

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-300 hover:border-dark-400'
                        }`}
                >
                    <input
                        type="file"
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                        <motion.div
                            animate={{ y: dragActive ? -10 : 0 }}
                            className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4"
                        >
                            <Upload className="w-8 h-8 text-primary-500" />
                        </motion.div>

                        <p className="text-white font-medium mb-2">
                            Drop your file here or click to browse
                        </p>
                        <p className="text-dark-600 text-sm">
                            All file types supported • Quantum-safe encryption
                        </p>

                        {file && !uploading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-dark-100 rounded-lg"
                            >
                                <File className="w-4 h-4 text-primary-500" />
                                <span className="text-sm text-white">{file.name}</span>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </motion.div>
                        )}

                        {uploading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center gap-2 text-primary-500"
                            >
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Encrypting and uploading...</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="mt-4 p-4 bg-dark-100 rounded-lg border border-dark-200">
                    <p className="text-xs text-dark-600">
                        <span className="font-medium text-primary-500">Security Notice:</span> Files are encrypted with AES-256-GCM and protected with post-quantum cryptography. OTP verification required.
                    </p>
                </div>
            </motion.div>

            <OTPModal
                isOpen={showOTPModal}
                onClose={() => {
                    setShowOTPModal(false);
                    setFile(null);
                }}
                onVerify={handleUpload}
                title="Verify OTP to Encrypt File"
            />
        </>
    );
}
