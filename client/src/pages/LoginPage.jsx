/**
 * LoginPage.jsx — Split-screen login layout
 * Left: Auth form  |  Right: Brand gradient panel
 */
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { connectSocket } from '../lib/socket';
import useChatStore from '../store/chatStore';
import AuthCard from '../components/auth/AuthCard';
import { motion } from 'framer-motion';
import { IconShield, IconLock, IconKey, IconFingerprint, IconArrowRight } from '@tabler/icons-react';

// ─── Feature badge for right panel ────────────────────────────────────────────
function FeatureBadge({ icon: Icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 20px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color="white" stroke={2} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{description}</p>
      </div>
    </motion.div>
  );
}

export default function LoginPage({ onLoggedIn }) {
  const setUser = useChatStore((s) => s.setUser);
  const setToken = useChatStore((s) => s.setToken);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setUser(user);
        setToken(token);
        onLoggedIn();
      }
    });
    return unsub;
  }, []);

  const handleSuccess = (user, token) => {
    setUser(user);
    setToken(token);
    onLoggedIn();
  };

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-auto md:overflow-hidden bg-background">

      {/* ── LEFT: Form panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full md:max-w-[520px] shrink-0 flex flex-col justify-center items-center px-6 py-12 md:p-10 relative z-10 overflow-y-auto"
      >
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '10%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: '#5865f2',
          opacity: 0.06,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
          <AuthCard onSuccess={handleSuccess} />
        </div>

        {/* Bottom tagline */}
        <p style={{
          marginTop: 32,
          fontSize: 12,
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}>
          Secure Web-Chat · ECDH P-256 + HKDF + AES-256-GCM
        </p>
      </motion.div>

      {/* ── RIGHT: Brand panel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full shrink-0 md:flex-1 relative flex flex-col justify-center p-8 md:p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3b3fa6 0%, #5865f2 40%, #00a8fc 100%)' }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          filter: 'blur(2px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(0,0,0,0.12)',
        }} />
        <div style={{
          position: 'absolute', top: '55%', right: '10%',
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        {/* Grid dot texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          {/* Brand logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ marginBottom: 36 }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
              }}>
                <IconShield size={28} color="white" stroke={2} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  SecureChat
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  End-to-End Encrypted Messaging
                </p>
              </div>
            </div>

            <h2 style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
            }}>
              Percakapan privat<br />
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>yang benar-benar aman.</span>
            </h2>
            <p style={{
              marginTop: 14, fontSize: 15,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.6,
            }}>
              Kunci enkripsi dibuat langsung di browser kamu dan tidak pernah meninggalkan perangkatmu.
            </p>
          </motion.div>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FeatureBadge
              icon={IconKey}
              title="ECDH P-256 Key Exchange"
              description="Kunci sesi dibuat baru setiap percakapan, tidak ada yang bisa mengulang."
              delay={0.35}
            />
            <FeatureBadge
              icon={IconLock}
              title="AES-256-GCM Encryption"
              description="Standar enkripsi militer. Setiap pesan dilindungi dengan nonce unik."
              delay={0.45}
            />
            <FeatureBadge
              icon={IconFingerprint}
              title="Zero Knowledge Server"
              description="Server hanya meneruskan data terenkripsi. Tidak bisa membaca isi pesanmu."
              delay={0.55}
            />
          </div>

          {/* Bottom CTA hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 36,
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
            }}
          >
            <IconArrowRight size={14} color="rgba(255,255,255,0.5)" stroke={2} />
            Buat akun gratis atau masuk untuk mulai mengobrol
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
