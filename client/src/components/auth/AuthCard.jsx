/**
 * AuthCard.jsx — Login & Register form (transparent, fits split-screen layout)
 */
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconShield, IconMail, IconLock, IconEye, IconEyeOff,
  IconAlertCircle, IconLoader2
} from '@tabler/icons-react';

const firebaseErrorMap = {
  'auth/email-already-in-use': 'Email sudah terdaftar.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Password minimal 6 karakter.',
  'auth/user-not-found': 'Email tidak ditemukan.',
  'auth/wrong-password': 'Password salah.',
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
};

function InputField({ label, type, value, onChange, placeholder, icon: Icon, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--muted-foreground)',
        marginBottom: 8,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
          color: focused ? '#5865f2' : 'var(--muted-foreground)',
          transition: 'color 0.2s',
        }}>
          <Icon size={16} stroke={2} />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            background: 'var(--muted)',
            border: `1.5px solid ${focused ? '#5865f2' : 'var(--border)'}`,
            borderRadius: 10,
            padding: rightSlot ? '13px 44px 13px 42px' : '13px 14px 13px 42px',
            fontSize: 14,
            color: 'var(--foreground)',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(88,101,242,0.15)' : 'none',
          }}
        />
        {rightSlot && (
          <span style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center',
          }}>
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AuthCard({ onSuccess }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userCredential;
      if (tab === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      const token = await userCredential.user.getIdToken();
      onSuccess(userCredential.user, token);
    } catch (err) {
      setError(firebaseErrorMap[err.code] || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #5865f2, #00a8fc)',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(88,101,242,0.35)',
        }}>
          <IconShield size={28} color="white" stroke={2} />
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.5px',
        }}>
          {tab === 'login' ? 'Selamat Datang' : 'Buat Akun'}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--muted-foreground)' }}>
          {tab === 'login'
            ? 'Masuk untuk melanjutkan percakapan aman.'
            : 'Daftar dan mulai enkripsi end-to-end gratis.'}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--muted)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 28,
        gap: 4,
      }}>
        {['login', 'register'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === t ? '#5865f2' : 'transparent',
              color: tab === t ? '#fff' : 'var(--muted-foreground)',
              boxShadow: tab === t ? '0 2px 8px rgba(88,101,242,0.3)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            {t === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.form
          key={tab}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            icon={IconMail}
          />

          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            icon={IconLock}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword
                  ? <IconEyeOff size={16} stroke={2} />
                  : <IconEye size={16} stroke={2} />}
              </button>
            }
          />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(242,63,67,0.1)',
                  border: '1px solid rgba(242,63,67,0.3)',
                  borderRadius: 10, padding: '10px 14px',
                  overflow: 'hidden',
                }}
              >
                <IconAlertCircle size={16} color="#f23f43" stroke={2} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#f23f43' }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              background: loading ? '#4752c4' : 'linear-gradient(135deg, #5865f2, #4752c4)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              opacity: loading ? 0.8 : 1,
              boxShadow: '0 4px 16px rgba(88,101,242,0.35)',
            }}
          >
            {loading ? (
              <>
                <IconLoader2 size={16} color="white" stroke={2} style={{ animation: 'spin 0.8s linear infinite' }} />
                {tab === 'login' ? 'Masuk...' : 'Mendaftar...'}
              </>
            ) : (
              tab === 'login' ? 'Masuk' : 'Buat Akun'
            )}
          </button>

          <p style={{
            textAlign: 'center', fontSize: 12,
            color: 'var(--muted-foreground)', marginTop: 20,
          }}>
            🔒 Semua pesan dienkripsi end-to-end di browser Anda
          </p>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
