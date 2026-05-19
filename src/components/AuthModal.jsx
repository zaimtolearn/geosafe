// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function AuthModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Validation Check
    const validateForm = () => {
        setError('');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address.";

        if (password.length < 8) return "Password must be at least 8 characters long.";
        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) return "Password must contain at least one letter and one number.";

        if (mode === 'register' && password !== confirmPassword) return "Passwords do not match.";
        return null;
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) return setError(validationError);

        setLoading(true);
        try {
            if (mode === 'register') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose(); // Close modal on success!
        } catch (err) {
            console.error(err);
            // Clean up Firebase error messages for the user
            if (err.code === 'auth/email-already-in-use') setError('This email is already registered.');
            else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError('Invalid email or password.');
            else setError('An error occurred. Please try again.');
        }
        setLoading(false);
    };

    const handleGoogleAuth = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to sign in with Google.");
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <div>
                        <label style={styles.label}>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="name@example.com" required />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label style={styles.label}>Password</label>
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Min 8 chars, letter & number" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    {mode === 'register' && (
                        <div style={{ position: 'relative' }}>
                            <label style={styles.label}>Confirm Password</label>
                            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} placeholder="Confirm your password" required />
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={styles.primaryBtn}>
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Register')}
                    </button>
                </form>

                <div style={styles.divider}>
                    <span style={{ backgroundColor: 'white', padding: '0 10px', color: '#94a3b8', fontSize: '0.85rem' }}>OR</span>
                </div>

                <button onClick={handleGoogleAuth} style={styles.googleBtn}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
                    Continue with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={styles.toggleBtn}>
                        {mode === 'login' ? 'Register here' : 'Sign in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 },
    errorBanner: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid #fecaca' },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '5px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' },
    primaryBtn: { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    divider: { textAlign: 'center', borderTop: '1px solid #e2e8f0', margin: '25px 0', position: 'relative' },
    googleBtn: { width: '100%', padding: '12px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    toggleBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }
};