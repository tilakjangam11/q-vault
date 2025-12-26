import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { fileService, historyService, workspaceService } from '../services/fileService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { LogOut, Activity, Shield, Lock, Unlock, RefreshCw, History, Clock, Mail, Loader2, CheckCircle, Eye, EyeOff, Key, Timer } from 'lucide-react';

// Components
import ThemeToggle from '../components/ThemeToggle';
import GreetingHeader from '../components/GreetingHeader';
import MediaTypeFilter from '../components/MediaTypeFilter';
import AnimatedFileDropZone from '../components/AnimatedFileDropZone';
import EncryptionProgress from '../components/EncryptionProgress';
import FileEncryptionAnimation from '../components/FileEncryptionAnimation';
import EncryptedFileWarning from '../components/EncryptedFileWarning';
import FileList from '../components/FileList';

export default function EnhancedDashboard() {
    const navigate = useNavigate();
    const [firebaseUser] = useAuthState(auth);

    // User Data
    const [userData, setUserData] = useState(null);

    // Lists
    const [files, setFiles] = useState([]);
    const [decryptedFiles, setDecryptedFiles] = useState([]);
    const [history, setHistory] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('encrypted');
    const [selectedMediaType, setSelectedMediaType] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    // Upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [showEncryptionSuccess, setShowEncryptionSuccess] = useState(false);

    // Decryption animation states
    const [showDecryptionAnimation, setShowDecryptionAnimation] = useState(false);
    const [decryptingFileName, setDecryptingFileName] = useState('');

    // OTP Modal states for decryption
    const [showDecryptionOTPModal, setShowDecryptionOTPModal] = useState(false);
    const [selectedFileForAction, setSelectedFileForAction] = useState(null);
    const [decryptionOtp, setDecryptionOtp] = useState('');
    const [decryptionOtpLoading, setDecryptionOtpLoading] = useState(false);
    const [decryptionOtpSent, setDecryptionOtpSent] = useState(false);
    const [decryptionOtpTimer, setDecryptionOtpTimer] = useState(300);

    // Workspace PIN states (using backend)
    const [workspacePinSet, setWorkspacePinSet] = useState(false);
    const [workspaceUnlocked, setWorkspaceUnlocked] = useState(false);
    const [showPinSetupModal, setShowPinSetupModal] = useState(false);
    const [showPinUnlockModal, setShowPinUnlockModal] = useState(false);
    const [showPinResetModal, setShowPinResetModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);

    // PIN Reset OTP states
    const [resetOtp, setResetOtp] = useState('');
    const [resetOtpSent, setResetOtpSent] = useState(false);
    const [resetOtpVerified, setResetOtpVerified] = useState(false);
    const [resetOtpLoading, setResetOtpLoading] = useState(false);
    const [resetOtpTimer, setResetOtpTimer] = useState(300);

    // Download states
    const [showEncryptedWarning, setShowEncryptedWarning] = useState(false);

    // Check if PIN is set on mount (from backend)
    useEffect(() => {
        const checkPinStatus = async () => {
            if (firebaseUser) {
                try {
                    const hasPin = await authService.getPinStatus();
                    setWorkspacePinSet(hasPin);
                } catch (error) {
                    console.log('PIN status check failed, assuming no PIN');
                    setWorkspacePinSet(false);
                }
            }
        };
        checkPinStatus();
    }, [firebaseUser]);

    // Load decrypted workspace files from backend on mount
    useEffect(() => {
        const loadWorkspaceFiles = async () => {
            if (firebaseUser) {
                try {
                    const workspaceFiles = await workspaceService.getWorkspaceFiles();
                    setDecryptedFiles(workspaceFiles);
                } catch (error) {
                    console.log('Failed to load workspace files from backend');
                }
            }
        };
        loadWorkspaceFiles();
    }, [firebaseUser]);

    useEffect(() => {
        loadData();
    }, [firebaseUser]);

    // Timer countdown for decryption OTP
    useEffect(() => {
        let interval;
        if (showDecryptionOTPModal && decryptionOtpSent && decryptionOtpTimer > 0) {
            interval = setInterval(() => {
                setDecryptionOtpTimer(prev => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showDecryptionOTPModal, decryptionOtpSent, decryptionOtpTimer]);

    // Timer countdown for PIN reset OTP
    useEffect(() => {
        let interval;
        if (showPinResetModal && resetOtpSent && !resetOtpVerified && resetOtpTimer > 0) {
            interval = setInterval(() => {
                setResetOtpTimer(prev => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showPinResetModal, resetOtpSent, resetOtpVerified, resetOtpTimer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const loadData = async () => {
        if (!firebaseUser) return;

        try {
            // Wait for Firebase token to be ready
            await firebaseUser.getIdToken();

            setLoading(true);
            const userDetails = await authService.getCurrentUser();
            setUserData(userDetails);
            const data = await fileService.listFiles();
            setFiles(data);
            try {
                const historyData = await historyService.getAllHistory();
                setHistory(historyData);
            } catch (e) {
                console.log('History not available yet');
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // ==================== PIN Management (Backend) ====================

    const handleSetPin = async () => {
        setPinError('');
        if (pinInput.length < 4 || pinInput.length > 10) {
            setPinError('PIN must be 4-10 characters');
            return;
        }
        if (pinInput !== confirmPinInput) {
            setPinError('PINs do not match');
            return;
        }

        setPinLoading(true);
        try {
            await authService.setPin(pinInput);
            setWorkspacePinSet(true);
            setWorkspaceUnlocked(true);
            setShowPinSetupModal(false);
            setPinInput('');
            setConfirmPinInput('');
            toast.success('Workspace PIN set successfully!');
        } catch (error) {
            setPinError(error.message || 'Failed to set PIN');
        } finally {
            setPinLoading(false);
        }
    };

    const handleUnlockWorkspace = async () => {
        setPinLoading(true);
        try {
            const result = await authService.verifyPin(pinInput);
            if (result.message === 'PIN verified successfully') {
                setWorkspaceUnlocked(true);
                setShowPinUnlockModal(false);
                setPinInput('');
                setPinError('');
                toast.success('Workspace unlocked!');
                setActiveTab('decrypted');
            } else {
                setPinError('Incorrect PIN');
            }
        } catch (error) {
            setPinError('Incorrect PIN');
        } finally {
            setPinLoading(false);
        }
    };

    // ==================== PIN Reset with OTP ====================

    const handleSendPinResetOTP = async () => {
        setResetOtpLoading(true);
        try {
            await authService.sendPinResetOTP();
            setResetOtpSent(true);
            setResetOtpTimer(300);
            toast.success('OTP sent to your email!');
        } catch (error) {
            toast.error('Failed to send OTP');
        } finally {
            setResetOtpLoading(false);
        }
    };

    const handleVerifyPinResetOTP = async () => {
        if (resetOtp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setResetOtpLoading(true);
        try {
            const result = await authService.verifyPinResetOTP(resetOtp);
            if (result.message === 'OTP verified successfully') {
                setResetOtpVerified(true);
                toast.success('OTP verified! Set your new PIN.');
            } else {
                toast.error('Invalid or expired OTP');
            }
        } catch (error) {
            toast.error('Invalid or expired OTP');
        } finally {
            setResetOtpLoading(false);
        }
    };

    const handleResetPin = async () => {
        if (!resetOtpVerified) {
            toast.error('Please verify OTP first');
            return;
        }
        if (pinInput.length < 4 || pinInput.length > 10) {
            setPinError('PIN must be 4-10 characters');
            return;
        }
        if (pinInput !== confirmPinInput) {
            setPinError('PINs do not match');
            return;
        }

        setPinLoading(true);
        try {
            await authService.resetPin(pinInput);
            setWorkspaceUnlocked(true);
            setShowPinResetModal(false);
            setPinInput('');
            setConfirmPinInput('');
            setResetOtp('');
            setResetOtpSent(false);
            setResetOtpVerified(false);
            toast.success('PIN reset successfully!');
        } catch (error) {
            setPinError(error.message || 'Failed to reset PIN');
        } finally {
            setPinLoading(false);
        }
    };

    const handleDecryptedTabClick = () => {
        if (!workspacePinSet) {
            setShowPinSetupModal(true);
        } else if (!workspaceUnlocked) {
            setShowPinUnlockModal(true);
        } else {
            setActiveTab('decrypted');
        }
    };

    // ==================== File Operations ====================

    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        handleUploadFile(file);
    };

    const handleUploadFile = async (file) => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('Generating secure key...');

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    if (prev > 50) setUploadStatus('Encrypting file...');
                    if (prev > 80) setUploadStatus('Finalizing encryption...');
                    return prev + 10;
                });
            }, 200);

            const idToken = await firebaseUser.getIdToken();
            await fileService.uploadFile(file, idToken);

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus('Encryption complete!');

            setTimeout(() => {
                setIsUploading(false);
                setShowEncryptionSuccess(true);
                setSelectedFile(null);
            }, 500);

        } catch (error) {
            toast.error(error.message || 'Upload failed');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEncryptionComplete = () => {
        setShowEncryptionSuccess(false);
        loadData();
    };

    const handleDownloadClick = (file) => {
        setSelectedFileForAction(file);
        setShowEncryptedWarning(true);
    };

    // ==================== Decryption with OTP ====================

    const handleDecryptFile = async () => {
        setShowEncryptedWarning(false);
        setDecryptionOtp('');
        setDecryptionOtpSent(false);
        setDecryptionOtpTimer(300);
        setShowDecryptionOTPModal(true);
    };

    const handleSendDecryptionOTP = async () => {
        setDecryptionOtpLoading(true);
        try {
            await authService.sendOTP();
            setDecryptionOtpSent(true);
            setDecryptionOtpTimer(300);
            toast.success('OTP sent to your email!');
        } catch (error) {
            toast.error('Failed to send OTP');
        } finally {
            setDecryptionOtpLoading(false);
        }
    };

    const handleVerifyDecryptionOTP = async () => {
        if (decryptionOtp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setDecryptionOtpLoading(true);
        try {
            const result = await authService.verifyOTP(decryptionOtp);
            if (result.message === 'OTP verified successfully') {
                setShowDecryptionOTPModal(false);
                handleProceedWithDecryption();
            } else {
                toast.error('Invalid or expired OTP');
            }
        } catch (error) {
            toast.error('Invalid or expired OTP');
        } finally {
            setDecryptionOtpLoading(false);
        }
    };

    const handleProceedWithDecryption = async () => {
        setDecryptingFileName(selectedFileForAction?.originalFilename || 'file');
        setShowDecryptionAnimation(true);

        try {
            const idToken = await firebaseUser.getIdToken(true);
            await fileService.downloadFile(selectedFileForAction.id, idToken);

            // Reload workspace files from backend (backend auto-adds on decryption)
            const workspaceFiles = await workspaceService.getWorkspaceFiles();
            setDecryptedFiles(workspaceFiles);

            loadData();
        } catch (error) {
            setShowDecryptionAnimation(false);
            toast.error(error.message || 'Decryption failed');
        }
    };

    const handleDecryptionAnimationComplete = () => {
        setShowDecryptionAnimation(false);
        setSelectedFileForAction(null);
        toast.success('File decrypted and moved to workspace!');

        if (workspacePinSet) {
            setWorkspaceUnlocked(true);
            setActiveTab('decrypted');
        }
    };

    const handleDownloadEncrypted = async () => {
        setShowEncryptedWarning(false);
        try {
            const idToken = await firebaseUser.getIdToken();
            await fileService.downloadEncrypted(selectedFileForAction.id, idToken);
            toast.success('Encrypted file downloaded');
        } catch (error) {
            toast.error('Download failed');
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const idToken = await firebaseUser.getIdToken();
            await fileService.deleteFile(fileId, idToken);
            toast.success('File deleted');
            loadData();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleRemoveFromDecrypted = async (fileId) => {
        try {
            await workspaceService.removeFromWorkspace(fileId);
            setDecryptedFiles(prev => prev.filter(f => f.id !== fileId));
            toast.success('Removed from workspace');
        } catch (error) {
            toast.error('Failed to remove from workspace');
        }
    };

    // Download decrypted file directly (already decrypted, just download again)
    const handleDownloadDecryptedFile = async (file) => {
        try {
            const idToken = await firebaseUser.getIdToken(true);
            await fileService.downloadFile(file.id, idToken);
            toast.success('File downloaded successfully!');
        } catch (error) {
            toast.error(error.message || 'Download failed');
        }
    };

    const handleLogout = async () => {
        setWorkspaceUnlocked(false);
        await auth.signOut();
        navigate('/login');
    };

    // Filter Logic
    const activeList = activeTab === 'encrypted' ? files : decryptedFiles;
    const filteredFiles = selectedMediaType === 'ALL'
        ? activeList
        : activeList.filter(f => f.mediaType === selectedMediaType);

    const fileCounts = {
        ALL: activeList.length,
        IMAGE: activeList.filter(f => f.mediaType === 'IMAGE').length,
        VIDEO: activeList.filter(f => f.mediaType === 'VIDEO').length,
        AUDIO: activeList.filter(f => f.mediaType === 'AUDIO').length,
        DOCUMENT: activeList.filter(f => f.mediaType === 'DOCUMENT').length,
        ARCHIVE: activeList.filter(f => f.mediaType === 'ARCHIVE').length,
    };

    const displayUserName = userData?.firstName || userData?.displayName || userData?.username || firebaseUser?.email?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Q-Vault
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />

                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${showHistory ? 'bg-primary-500/20 text-primary-500' : 'hover:bg-gray-700'}`}
                                style={{ color: showHistory ? undefined : 'var(--text-secondary)' }}
                            >
                                <History className="w-5 h-5" />
                                <span className="hidden sm:inline">History</span>
                            </button>

                            <button
                                onClick={() => navigate('/audit')}
                                className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <Activity className="w-5 h-5" />
                                <span className="hidden sm:inline">Audit</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <GreetingHeader userName={displayUserName} />

                {/* History Panel */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="glass rounded-2xl p-4">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <History className="w-5 h-5 text-primary-500" />
                                    Encryption/Decryption History (Read-Only)
                                </h3>
                                {history.length === 0 ? (
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No history yet</p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {history.slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.operation === 'ENCRYPT' ? 'bg-primary-500/20 text-primary-500' : 'bg-green-500/20 text-green-500'}`}>
                                                        {item.operation === 'ENCRYPT' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.fileName}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.fileCategory}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xs font-medium ${item.operation === 'ENCRYPT' ? 'text-primary-400' : 'text-green-400'}`}>
                                                        {item.operation}
                                                    </p>
                                                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Tabs */}
                <div className="flex items-center gap-4 mb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('encrypted')}
                        className={`pb-3 px-2 flex items-center gap-2 font-medium transition-all relative ${activeTab === 'encrypted' ? 'text-primary-500' : 'text-gray-500'}`}
                    >
                        <Lock className="w-4 h-4" />
                        Encrypted Vault
                        {activeTab === 'encrypted' && (
                            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                    <button
                        onClick={handleDecryptedTabClick}
                        className={`pb-3 px-2 flex items-center gap-2 font-medium transition-all relative ${activeTab === 'decrypted' ? 'text-green-500' : 'text-gray-500'}`}
                    >
                        {workspacePinSet && !workspaceUnlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        Decrypted Workspace
                        {decryptedFiles.length > 0 && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {decryptedFiles.length}
                            </span>
                        )}
                        {activeTab === 'decrypted' && (
                            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <MediaTypeFilter
                            selectedType={selectedMediaType}
                            onTypeChange={setSelectedMediaType}
                            fileCounts={fileCounts}
                        />
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === 'encrypted' && (
                            <AnimatedFileDropZone
                                onFileSelect={handleFileSelect}
                                isUploading={isUploading}
                            />
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {selectedMediaType === 'ALL' ? 'Files' : `${selectedMediaType.toLowerCase()}s`}
                                    <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        ({filteredFiles.length})
                                    </span>
                                </h2>
                                <button
                                    onClick={loadData}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="spinner w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto animate-spin" />
                                    <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading files...</p>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="text-center py-12 glass rounded-2xl">
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {activeTab === 'encrypted'
                                            ? (selectedMediaType === 'ALL' ? 'No files yet. Upload to encrypt!' : `No matching ${selectedMediaType.toLowerCase()}s.`)
                                            : 'No decrypted files in this session.'}
                                    </p>
                                </div>
                            ) : (
                                <FileList
                                    files={filteredFiles}
                                    onDownload={activeTab === 'encrypted' ? handleDownloadClick : handleDownloadDecryptedFile}
                                    onDelete={activeTab === 'encrypted' ? handleDeleteFile : handleRemoveFromDecrypted}
                                    isDecryptedView={activeTab === 'decrypted'}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isUploading && (
                    <EncryptionProgress
                        progress={uploadProgress}
                        status={uploadStatus}
                        fileName={selectedFile?.name}
                    />
                )}

                {showEncryptionSuccess && (
                    <FileEncryptionAnimation
                        fileName={selectedFile?.name}
                        onComplete={handleEncryptionComplete}
                    />
                )}

                {showDecryptionAnimation && (
                    <DecryptionAnimation
                        fileName={decryptingFileName}
                        onComplete={handleDecryptionAnimationComplete}
                    />
                )}

                {showEncryptedWarning && (
                    <EncryptedFileWarning
                        fileName={selectedFileForAction?.originalFilename}
                        onDecrypt={handleDecryptFile}
                        onDownloadEncrypted={handleDownloadEncrypted}
                        onClose={() => setShowEncryptedWarning(false)}
                    />
                )}
            </AnimatePresence>

            {/* Decryption OTP Modal */}
            {showDecryptionOTPModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Verify to Decrypt</h2>
                                <p className="text-sm text-gray-400">OTP required for decryption</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!decryptionOtpSent ? (
                                <>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-1">OTP will be sent to:</p>
                                        <p className="text-lg font-mono text-white">{firebaseUser?.email}</p>
                                    </div>

                                    <button
                                        onClick={handleSendDecryptionOTP}
                                        disabled={decryptionOtpLoading}
                                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {decryptionOtpLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Mail className="w-5 h-5" />
                                                Send OTP
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Timer */}
                                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/50">
                                        <Timer className={`w-5 h-5 ${decryptionOtpTimer > 60 ? 'text-green-500' : decryptionOtpTimer > 0 ? 'text-yellow-500' : 'text-red-500'}`} />
                                        <span className={`font-mono text-lg ${decryptionOtpTimer > 60 ? 'text-green-400' : decryptionOtpTimer > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {decryptionOtpTimer > 0 ? formatTime(decryptionOtpTimer) : 'Expired'}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-300">
                                            Enter 6-Digit OTP
                                        </label>
                                        <input
                                            type="text"
                                            value={decryptionOtp}
                                            onChange={(e) => setDecryptionOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-4 rounded-lg border bg-gray-800/50 border-gray-600 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        onClick={handleVerifyDecryptionOTP}
                                        disabled={decryptionOtpLoading || decryptionOtp.length !== 6 || decryptionOtpTimer === 0}
                                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {decryptionOtpLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Unlock className="w-5 h-5" />
                                                Verify & Decrypt
                                            </>
                                        )}
                                    </button>

                                    {decryptionOtpTimer === 0 && (
                                        <button
                                            onClick={handleSendDecryptionOTP}
                                            className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </>
                            )}

                            <button
                                onClick={() => { setShowDecryptionOTPModal(false); setDecryptionOtp(''); setDecryptionOtpSent(false); }}
                                className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* PIN Setup Modal */}
            {showPinSetupModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Set Workspace PIN</h2>
                                <p className="text-sm text-gray-400">Secure your decrypted files</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Create PIN (4-10 characters)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPin ? 'text' : 'password'}
                                        value={pinInput}
                                        onChange={(e) => setPinInput(e.target.value)}
                                        maxLength={10}
                                        className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter PIN"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Confirm PIN
                                </label>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={confirmPinInput}
                                    onChange={(e) => setConfirmPinInput(e.target.value)}
                                    maxLength={10}
                                    className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Confirm PIN"
                                />
                            </div>

                            {pinError && (
                                <p className="text-red-400 text-sm">{pinError}</p>
                            )}

                            <button
                                onClick={handleSetPin}
                                disabled={pinLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {pinLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Set PIN & Open Workspace
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => { setShowPinSetupModal(false); setPinInput(''); setConfirmPinInput(''); setPinError(''); }}
                                className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* PIN Unlock Modal */}
            {showPinUnlockModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Unlock Workspace</h2>
                                <p className="text-sm text-gray-400">Enter your PIN to access</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Enter PIN
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPin ? 'text' : 'password'}
                                        value={pinInput}
                                        onChange={(e) => setPinInput(e.target.value)}
                                        maxLength={10}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUnlockWorkspace()}
                                        className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter PIN"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {pinError && (
                                <p className="text-red-400 text-sm">{pinError}</p>
                            )}

                            <button
                                onClick={handleUnlockWorkspace}
                                disabled={pinLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {pinLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Unlock className="w-5 h-5" />
                                        Unlock
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => { setShowPinUnlockModal(false); setShowPinResetModal(true); setPinInput(''); setPinError(''); }}
                                className="w-full py-2 text-primary-400 hover:text-primary-300 text-sm"
                            >
                                Forgot PIN? Reset via OTP
                            </button>

                            <button
                                onClick={() => { setShowPinUnlockModal(false); setPinInput(''); setPinError(''); }}
                                className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* PIN Reset Modal with OTP */}
            {showPinResetModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Reset PIN</h2>
                                <p className="text-sm text-gray-400">Verify via OTP to reset</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!resetOtpVerified ? (
                                <>
                                    {!resetOtpSent ? (
                                        <>
                                            <div className="bg-gray-800/50 rounded-lg p-4">
                                                <p className="text-sm text-gray-400 mb-1">OTP will be sent to:</p>
                                                <p className="text-lg font-mono text-white">{firebaseUser?.email}</p>
                                            </div>

                                            <button
                                                onClick={handleSendPinResetOTP}
                                                disabled={resetOtpLoading}
                                                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {resetOtpLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Mail className="w-5 h-5" />
                                                        Send OTP
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Timer */}
                                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/50">
                                                <Timer className={`w-5 h-5 ${resetOtpTimer > 60 ? 'text-green-500' : resetOtpTimer > 0 ? 'text-yellow-500' : 'text-red-500'}`} />
                                                <span className={`font-mono text-lg ${resetOtpTimer > 60 ? 'text-green-400' : resetOtpTimer > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {resetOtpTimer > 0 ? formatTime(resetOtpTimer) : 'Expired'}
                                                </span>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                                    Enter 6-Digit OTP
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resetOtp}
                                                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="w-full px-4 py-4 rounded-lg border bg-gray-800/50 border-gray-600 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    autoFocus
                                                />
                                            </div>

                                            <button
                                                onClick={handleVerifyPinResetOTP}
                                                disabled={resetOtpLoading || resetOtp.length !== 6 || resetOtpTimer === 0}
                                                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {resetOtpLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    'Verify OTP'
                                                )}
                                            </button>

                                            {resetOtpTimer === 0 && (
                                                <button
                                                    onClick={handleSendPinResetOTP}
                                                    className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                                >
                                                    Resend OTP
                                                </button>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <p className="text-sm text-green-400">OTP verified! Set new PIN below.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-300">New PIN (4-10 characters)</label>
                                        <input
                                            type={showPin ? 'text' : 'password'}
                                            value={pinInput}
                                            onChange={(e) => setPinInput(e.target.value)}
                                            maxLength={10}
                                            className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="New PIN"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Confirm New PIN</label>
                                        <input
                                            type={showPin ? 'text' : 'password'}
                                            value={confirmPinInput}
                                            onChange={(e) => setConfirmPinInput(e.target.value)}
                                            maxLength={10}
                                            className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Confirm PIN"
                                        />
                                    </div>

                                    {pinError && <p className="text-red-400 text-sm">{pinError}</p>}

                                    <button
                                        onClick={handleResetPin}
                                        disabled={pinLoading}
                                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {pinLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5" />
                                                Reset PIN
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => { setShowPinResetModal(false); setPinInput(''); setConfirmPinInput(''); setPinError(''); setResetOtp(''); setResetOtpSent(false); setResetOtpVerified(false); }}
                                className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

// Decryption Animation Component with Progress
function DecryptionAnimation({ fileName, onComplete }) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing decryption...');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                // Update status messages based on progress
                if (prev > 30 && prev <= 35) setStatus('Reconstructing quantum key...');
                if (prev > 60 && prev <= 65) setStatus('Decrypting data...');
                if (prev > 90 && prev <= 95) setStatus('Finalizing...');
                return prev + 2;
            });
        }, 60);

        return () => clearInterval(progressInterval);
    }, []);

    useEffect(() => {
        if (progress === 100 && !completed) {
            setCompleted(true);
            setStatus('Moved to decrypted workspace');
            setTimeout(onComplete, 1200);
        }
    }, [progress, completed, onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="text-center w-full max-w-md px-6">
                <motion.div
                    animate={{
                        scale: completed ? [1, 1.1, 1] : [1, 1.05, 1],
                        rotate: completed ? 0 : [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: completed ? 0.5 : 1.5,
                        repeat: completed ? 0 : Infinity,
                        ease: "easeInOut"
                    }}
                    className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl ${completed
                        ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50'
                        : 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-500/50'
                        }`}
                >
                    {completed ? (
                        <CheckCircle className="w-12 h-12 text-white" />
                    ) : (
                        <Unlock className="w-12 h-12 text-white" />
                    )}
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2"
                >
                    {completed ? 'Decryption Complete!' : 'Decrypting File'}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 mb-6"
                >
                    {fileName}
                </motion.p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                        className={`h-full rounded-full ${completed
                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                    />
                </div>

                {/* Progress Percentage */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-between items-center mb-4"
                >
                    <span className={`text-sm font-medium ${completed ? 'text-green-400' : 'text-gray-400'}`}>
                        {status}
                    </span>
                    <span className={`text-lg font-bold ${completed ? 'text-green-400' : 'text-white'}`}>
                        {progress}%
                    </span>
                </motion.div>

                {/* Completion Message */}
                {completed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
                    >
                        <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            File successfully moved to decrypted workspace
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
