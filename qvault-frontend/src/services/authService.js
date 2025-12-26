import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

/**
 * Auth Service
 * 
 * Handles:
 * - Firebase email/password authentication
 * - Backend user registration
 * - Login 2FA with email OTP
 * - PIN management for workspace access
 */
export const authService = {
    // Sign in with email and password (Step 1 of 2FA)
    async signIn(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        // Verify with backend (credentials only, OTP still needed)
        const response = await api.post('/auth/verify-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Send Login OTP (Step 2a of 2FA)
    async sendLoginOTP() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/auth/login/send-otp', null, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Verify Login OTP (Step 2b of 2FA)
    async verifyLoginOTP(otp) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/auth/login/verify-otp', null, {
            params: { otp },
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Sign up with email and password (Firebase only)
    async signUp(email, password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Send email verification
        await sendEmailVerification(userCredential.user);

        return userCredential.user;
    },

    // Register user with backend (after Firebase auth)
    async registerWithBackend(idToken, userData) {
        const response = await api.post('/auth/register', userData, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        return response.data;
    },

    // ==================== PIN Management ====================

    // Get PIN status (check if PIN is set)
    async getPinStatus() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.get('/pin/status', {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data.message === 'PIN is set';
    },

    // Set workspace PIN
    async setPin(pin) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/pin/set', { pin }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Verify workspace PIN
    async verifyPin(pin) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/pin/verify', { pin }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Send PIN Reset OTP
    async sendPinResetOTP() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/pin/reset/send-otp', null, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Verify PIN Reset OTP
    async verifyPinResetOTP(otp) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/pin/reset/verify-otp', { otp }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Reset PIN (after OTP verified)
    async resetPin(newPin) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/pin/reset', { newPin }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // ==================== Legacy OTP (for decryption) ====================

    // Send OTP to email (for sensitive operations)
    async sendOTP() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/auth/send-otp', null, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // Verify OTP
    async verifyOTP(otp) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const token = await user.getIdToken();
        const response = await api.post('/auth/verify-otp', null, {
            params: { otp },
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    },

    // ==================== User Management ====================

    // Get current user from backend
    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Sign out
    async signOut() {
        await firebaseSignOut(auth);
    },

    // Get current Firebase user
    getCurrentFirebaseUser() {
        return auth.currentUser;
    },

    // Get ID token
    async getIdToken() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');
        return await user.getIdToken();
    },

    // Check if email is verified (Firebase)
    isEmailVerified() {
        return auth.currentUser?.emailVerified || false;
    },

    // Resend email verification
    async resendEmailVerification() {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');
        await sendEmailVerification(user);
    }
};
