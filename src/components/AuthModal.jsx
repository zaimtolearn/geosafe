// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// --- SVG ICONS FOR UI ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

export default function AuthModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- REAL-TIME PASSWORD VALIDATION ---
    const reqs = {
        length: password.length >= 8,
        capital: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const allReqsMet = reqs.length && reqs.capital && reqs.number && reqs.special;
    const passwordsMatch = password === confirmPassword && password.length > 0;

    // Check if the submit button should be disabled
    const isSubmitDisabled = loading ||
        (mode === 'register' && (!allReqsMet || !passwordsMatch || !email)) ||
        (mode === 'login' && (!email || !password));

    // Handle form submission
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return setError("Please enter a valid email address.");

        setLoading(true);
        try {
            if (mode === 'register') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Reset state and close modal on success
            setEmail(''); setPassword(''); setConfirmPassword(''); setError('');
            onClose();
        } catch (err) {
            console.error(err);
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

                    {/* EMAIL INPUT */}
                    <div>
                        <label style={styles.label}>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="name@example.com" required />
                    </div>

                    {/* PASSWORD INPUT */}
                    <div style={{ position: 'relative' }}>
                        <label style={styles.label}>Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter your password"
                            required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    {/* PASSWORD CHECKLIST (Only visible during Registration) */}
                    {mode === 'register' && (
                        <div style={styles.checklistContainer}>
                            <div style={reqs.length ? styles.reqMet : styles.reqUnmet}>
                                {reqs.length ? '✅' : '⚪'} Minimum 8 characters
                            </div>
                            <div style={reqs.capital ? styles.reqMet : styles.reqUnmet}>
                                {reqs.capital ? '✅' : '⚪'} One capital letter
                            </div>
                            <div style={reqs.number ? styles.reqMet : styles.reqUnmet}>
                                {reqs.number ? '✅' : '⚪'} One number
                            </div>
                            <div style={reqs.special ? styles.reqMet : styles.reqUnmet}>
                                {reqs.special ? '✅' : '⚪'} One special character
                            </div>
                        </div>
                    )}

                    {/* CONFIRM PASSWORD INPUT */}
                    {mode === 'register' && (
                        <div style={{ position: 'relative' }}>
                            <label style={styles.label}>Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    ...styles.input,
                                    // Highlight red if they type something and it doesn't match
                                    borderColor: confirmPassword.length > 0 && !passwordsMatch ? '#ef4444' : '#cbd5e1'
                                }}
                                placeholder="Confirm your password"
                                required
                            />
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>Passwords do not match.</span>
                            )}
                        </div>
                    )}

                    {/* DYNAMIC SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        style={{
                            ...styles.primaryBtn,
                            backgroundColor: isSubmitDisabled ? '#94a3b8' : '#3b82f6',
                            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Register')}
                    </button>
                </form>

                <div style={styles.divider}>
                    <span style={{ backgroundColor: 'white', padding: '0 10px', color: '#94a3b8', fontSize: '0.85rem' }}>OR</span>
                </div>

                <button type="button" onClick={handleGoogleAuth} style={styles.googleBtn}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
                    Continue with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setPassword(''); setConfirmPassword(''); }}
                        style={styles.toggleBtn}
                    >
                        {mode === 'login' ? 'Register here' : 'Sign in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif', maxHeight: '90vh', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 },
    errorBanner: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid #fecaca' },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '5px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' },
    eyeBtn: { position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 },
    primaryBtn: { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', marginTop: '10px', transition: 'background-color 0.2s' },
    divider: { textAlign: 'center', borderTop: '1px solid #e2e8f0', margin: '25px 0', position: 'relative' },
    googleBtn: { width: '100%', padding: '12px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    toggleBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '0.9rem' },

    // Checklist Styles
    checklistContainer: { backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' },
    reqMet: { fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' },
    reqUnmet: { fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }
};