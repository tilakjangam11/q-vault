import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Shield, Loader2, Key, Timer } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 2FA OTP states
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds
    const [canResend, setCanResend] = useState(false);

    // Timer countdown for OTP
    useEffect(() => {
        let interval;
        if (showOTPModal && otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer(prev => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showOTPModal, otpTimer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Step 1: Verify credentials
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verify credentials with Firebase
            await authService.signIn(email, password);

            // Send login OTP
            await authService.sendLoginOTP();

            // Show OTP modal
            setShowOTPModal(true);
            setOtpTimer(300);
            setCanResend(false);
            toast.success('OTP sent to your email!');
        } catch (error) {
            console.error('Authentication error:', error);
            toast.error(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setOtpLoading(true);
        try {
            const result = await authService.verifyLoginOTP(otp);

            if (result && result.message === 'Login successful') {
                toast.success('Login successful!');
                setShowOTPModal(false);
                navigate('/dashboard');
            } else {
                toast.error('Invalid or expired OTP');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast.error(error.message || 'OTP verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        try {
            await authService.sendLoginOTP();
            setOtpTimer(300);
            setCanResend(false);
            setOtp('');
            toast.success('New OTP sent to your email!');
        } catch (error) {
            toast.error('Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/50"
                    >
                        <Shield className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                        Q-Vault
                    </h1>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Quantum-Safe Encryption Platform</p>
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-strong rounded-2xl p-8 shadow-2xl"
                >
                    <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                        <button
                            className="flex-1 py-2 px-4 rounded-md font-medium transition-all bg-primary-500 text-white shadow-lg"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="flex-1 py-2 px-4 rounded-md font-medium transition-all hover:bg-white/5"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Login'
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 p-4 rounded-lg border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-start gap-2">
                            <Shield className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    After password verification, you'll receive an OTP via email for secure login.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
                    Protected by post-quantum cryptography
                </p>
            </motion.div>

            {/* OTP Verification Modal */}
            <AnimatePresence>
                {showOTPModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="glass-strong rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <Key className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Enter OTP</h2>
                                    <p className="text-sm text-gray-400">Check your email for the code</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Timer */}
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/50">
                                    <Timer className={`w-5 h-5 ${otpTimer > 60 ? 'text-green-500' : otpTimer > 0 ? 'text-yellow-500' : 'text-red-500'}`} />
                                    <span className={`font-mono text-lg ${otpTimer > 60 ? 'text-green-400' : otpTimer > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {otpTimer > 0 ? formatTime(otpTimer) : 'Expired'}
                                    </span>
                                </div>

                                {/* OTP Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        6-Digit OTP
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-4 rounded-lg border bg-gray-800/50 border-gray-600 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>

                                {/* Verify Button */}
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={otpLoading || otp.length !== 6 || otpTimer === 0}
                                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {otpLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Key className="w-5 h-5" />
                                            Verify OTP
                                        </>
                                    )}
                                </button>

                                {/* Resend Button */}
                                {canResend && (
                                    <button
                                        onClick={handleResendOTP}
                                        className="w-full py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                    >
                                        Resend OTP
                                    </button>
                                )}

                                {/* Cancel */}
                                <button
                                    onClick={() => {
                                        setShowOTPModal(false);
                                        setOtp('');
                                        authService.signOut();
                                    }}
                                    className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
