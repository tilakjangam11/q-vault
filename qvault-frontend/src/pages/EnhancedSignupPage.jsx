import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

/**
 * Enhanced Signup Page
 * 
 * Flow:
 * 1. Collect: First Name, Last Name, Username, Email, Password, Confirm Password
 * 2. Create Firebase account + send email verification link
 * 3. User verifies email via link
 * 4. Account activated
 */
export default function EnhancedSignupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});

    // Check email verification status periodically
    useEffect(() => {
        let interval;
        if (step === 2 && !emailVerified) {
            interval = setInterval(async () => {
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        setEmailVerified(true);
                        toast.success('Email verified!');
                        clearInterval(interval);
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, emailVerified]);

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.firstName || formData.firstName.length < 2) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName || formData.lastName.length < 2) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateAccount = async () => {
        if (!validateStep1()) return;

        setLoading(true);
        try {
            // Create Firebase account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Send email verification link
            await sendEmailVerification(userCredential.user);

            toast.success('Account created! Please verify your email.');
            setStep(2);

        } catch (error) {
            console.error('Signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email already registered. Please login.');
            } else {
                toast.error(error.message || 'Signup failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmailVerification = async () => {
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                toast.success('Verification email sent!');
            }
        } catch (error) {
            toast.error('Failed to resend email');
        }
    };

    const handleCheckEmailVerification = async () => {
        setCheckingEmail(true);
        try {
            await auth.currentUser?.reload();
            if (auth.currentUser?.emailVerified) {
                setEmailVerified(true);
                toast.success('Email verified!');
            } else {
                toast.error('Email not yet verified. Please check your inbox.');
            }
        } catch (error) {
            toast.error('Failed to check verification status');
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleCompleteSignup = async () => {
        if (!emailVerified) {
            toast.error('Please verify your email first');
            return;
        }

        setLoading(true);
        try {
            // Register user in backend
            const idToken = await auth.currentUser.getIdToken();
            await authService.registerWithBackend(idToken, {
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            toast.success('Account setup complete!');
            navigate('/dashboard');

        } catch (error) {
            console.error('Backend registration error:', error);
            toast.error('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Signup Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
                    Create Account
                </h1>
                <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
                    Q-Vault Quantum-Safe Encryption
                </p>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-8 gap-2">
                    {[1, 2].map((s) => (
                        <div
                            key={s}
                            className={`h-2 rounded-full transition-all ${s === step ? 'w-12 bg-primary-500' :
                                    s < step ? 'w-8 bg-primary-500/50' : 'w-8 bg-gray-600'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Account Details */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Name Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-primary)'
                                        }}
                                        placeholder="John"
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-primary)'
                                        }}
                                        placeholder="Doe"
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    <User className="w-4 h-4 inline mr-2" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="johndoe"
                                />
                                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="john@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="••••••••"
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                onClick={handleCreateAccount}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Email Verification */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Email Verification Status */}
                            <div className={`p-4 rounded-lg border ${emailVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                                <div className="flex items-center gap-3">
                                    {emailVerified ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Mail className="w-6 h-6 text-yellow-500" />
                                    )}
                                    <div>
                                        <p className={`font-medium ${emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {emailVerified ? 'Email Verified!' : 'Verify Your Email'}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {emailVerified
                                                ? 'Your email has been verified'
                                                : `Check ${formData.email} for verification link`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!emailVerified && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleResendEmailVerification}
                                        className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                                    >
                                        Resend Email
                                    </button>
                                    <button
                                        onClick={handleCheckEmailVerification}
                                        disabled={checkingEmail}
                                        className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm flex items-center justify-center gap-1"
                                    >
                                        {checkingEmail ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Check Status'
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Complete Signup */}
                            <button
                                onClick={handleCompleteSignup}
                                disabled={!emailVerified || loading}
                                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Complete Signup
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Login Link */}
                <p className="text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary-500 hover:text-primary-400 font-medium"
                    >
                        Login
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
