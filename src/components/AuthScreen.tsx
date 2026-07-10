import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { ArrowRight, Phone, RotateCcw, ShieldCheck } from 'lucide-react';
import * as THREE from 'three';
import { useAuth } from '../contexts/AuthContext';
import { StarLogo } from './Icons';

function GalaxyParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 1800;

  const { positions, colors } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 7 + Math.random() * 28;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 20;
      p[i * 3] = Math.cos(angle) * radius;
      p[i * 3 + 1] = height;
      p[i * 3 + 2] = Math.sin(angle) * radius;
      const t = Math.random();
      c[i * 3] = 0.48 + t * 0.36;
      c[i * 3 + 1] = 0.6 + t * 0.24;
      c[i * 3 + 2] = 0.76 + t * 0.22;
    }
    return { positions: p, colors: c };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const tex = useMemo(() => {
    const size = 36;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.17, 'rgba(210,232,255,0.9)');
    grad.addColorStop(0.44, 'rgba(115,190,255,0.24)');
    grad.addColorStop(1, 'rgba(80,120,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.016;
    ref.current.rotation.x = Math.sin(t * 0.015) * 0.052;
    (ref.current.material as THREE.PointsMaterial).opacity = 0.4 + Math.sin(t * 0.26) * 0.08;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        map={tex}
        size={0.092}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.46}
      />
    </points>
  );
}

function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <div className={`auth-brand-mark ${large ? 'auth-brand-mark-large' : ''}`}>
      <div className="auth-brand-mark-glow" />
      <StarLogo size={large ? 58 : 34} className="relative z-10 text-white/88" />
    </div>
  );
}

export default function AuthScreen() {
  const { sendCode, rememberedPhone, clearRemembered } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const verifyOtpRef = useRef<(code: string) => Promise<void>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [quickLogin, setQuickLogin] = useState(!!rememberedPhone);

  const [skipWelcome] = useState(() => {
    const flag = sessionStorage.getItem('star-diary-skip-welcome');
    if (flag) sessionStorage.removeItem('star-diary-skip-welcome');
    return !!flag;
  });

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSendCode = async (phoneNumber?: string) => {
    setError('');
    const phoneNum = (phoneNumber || phone).trim();
    if (!/^1[3-9]\d{9}$/.test(phoneNum)) {
      setError('请输入正确的手机号');
      return;
    }
    setLoading(true);
    try {
      const result = await sendCode(`+86${phoneNum}`);
      verifyOtpRef.current = result.verifyOtp;
      setPhone(phoneNum);
      setCodeSent(true);
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }
    if (!verifyOtpRef.current) {
      setError('请先获取验证码');
      return;
    }
    setLoading(true);
    try {
      await verifyOtpRef.current(code.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCodeSent(false);
    setCode('');
    setPhone('');
    setError('');
    setCountdown(0);
    verifyOtpRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSwitchAccount = () => {
    clearRemembered();
    setQuickLogin(false);
    resetForm();
  };

  const rawRemembered = rememberedPhone?.replace(/^\+86/, '') || '';
  const maskedPhone = rawRemembered
    ? `${rawRemembered.slice(0, 3)} **** ${rawRemembered.slice(-4)}`
    : '';

  const handleQuickLogin = () => {
    if (rawRemembered) handleSendCode(rawRemembered);
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden bg-[#02040d]">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 54 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
          <color attach="background" args={['#02040d']} />
          <GalaxyParticles />
        </Canvas>
      </div>

      <div className="auth-visual-field absolute inset-0 pointer-events-none" />
      <div className="auth-ribbon auth-ribbon-a" />
      <div className="auth-ribbon auth-ribbon-b" />

      <div className="auth-shell absolute inset-0 z-10 mx-auto grid w-full max-w-[1220px] grid-cols-1 items-center gap-10 px-5 py-[calc(1.5rem+env(safe-area-inset-top))] lg:grid-cols-[1fr_480px] lg:px-14 lg:py-10">
        <motion.section
          className="auth-hero hidden min-w-0 lg:block"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
        >
          <BrandMark large />
          <p className="mt-8 text-[12px] uppercase tracking-[0.34em] text-cyan-100/36">private memory atlas</p>
          <h1 className="dot-art-title mt-5 text-[72px] font-light leading-[0.95] tracking-[0.12em] text-white/92">
            STAR
            <br />
            DIARY
          </h1>
          <div className="mt-8 h-px w-72 bg-gradient-to-r from-cyan-100/42 via-white/18 to-transparent" />
          <p className="mt-7 max-w-[460px] text-[16px] font-light leading-8 tracking-[0.08em] text-white/48">
            把每天的情绪、片段和照片，收进一片只属于你的夜空。
          </p>
        </motion.section>

        <motion.section
          className="auth-panel relative mx-auto w-full max-w-[480px]"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 150 }}
        >
          <div className="auth-panel-orbit auth-panel-orbit-a" />
          <div className="auth-panel-orbit auth-panel-orbit-b" />

          <div className="auth-card relative overflow-hidden rounded-[18px] px-6 py-7 sm:px-10 sm:py-11">
            <div className="relative z-10">
              <header className="mb-9">
                <div className="flex items-center gap-4">
                  <BrandMark />
                  <div className="min-w-0">
                    <h2 className="text-[26px] font-light tracking-[0.22em] text-white/92">星空日记</h2>
                    <p className="mt-2 text-[13px] leading-6 tracking-[0.08em] text-white/42">
                      {codeSent ? '输入验证码，回到你的星空。' : '登录后同步你的私人星图。'}
                    </p>
                  </div>
                </div>
              </header>

              {quickLogin && rememberedPhone && !codeSent && (
                <div className="space-y-6">
                  {!skipWelcome && (
                    <div>
                      <p className="text-[13px] tracking-[0.12em] text-white/38">欢迎回来</p>
                    </div>
                  )}

                  <div className="auth-input-shell">
                    <Phone size={18} strokeWidth={1.55} className="auth-input-icon" />
                    <span className="text-[15px] tracking-[0.12em] text-white/72">+86 {maskedPhone}</span>
                  </div>

                  {error && <p className="auth-error">{error}</p>}

                  <motion.button
                    type="button"
                    disabled={loading}
                    onClick={handleQuickLogin}
                    className="auth-primary-button group"
                    whileHover={!loading ? { y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                  >
                    <span>{loading ? '发送中...' : '一键登录'}</span>
                    <ArrowRight size={18} strokeWidth={1.55} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  <button type="button" onClick={handleSwitchAccount} className="auth-secondary-link">
                    切换账号
                  </button>
                </div>
              )}

              {!codeSent && !quickLogin && (
                <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="space-y-6">
                  <label className="block">
                    <span className="auth-field-label">手机号</span>
                    <div className={`auth-input-shell ${focusedField === 'phone' ? 'auth-input-shell-focus' : ''}`}>
                      <Phone size={18} strokeWidth={1.55} className="auth-input-icon" />
                      <span className="auth-phone-prefix">+86</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="输入手机号"
                        className="auth-text-input"
                        autoFocus
                      />
                    </div>
                  </label>

                  {error && <p className="auth-error">{error}</p>}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="auth-primary-button group"
                    whileHover={!loading ? { y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                  >
                    <span>{loading ? '发送中...' : '获取验证码'}</span>
                    <ArrowRight size={18} strokeWidth={1.55} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  {rememberedPhone && (
                    <button
                      type="button"
                      onClick={() => { resetForm(); setQuickLogin(true); }}
                      className="auth-secondary-link"
                    >
                      <RotateCcw size={15} strokeWidth={1.55} />
                      返回快速登录
                    </button>
                  )}
                </form>
              )}

              {codeSent && (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="auth-message">
                    验证码已发送至 <span>+86 {phone || rawRemembered}</span>
                  </div>

                  <label className="block">
                    <span className="auth-field-label">验证码</span>
                    <div className={`auth-input-shell ${focusedField === 'code' ? 'auth-input-shell-focus' : ''}`}>
                      <ShieldCheck size={18} strokeWidth={1.55} className="auth-input-icon" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onFocus={() => setFocusedField('code')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="输入 6 位验证码"
                        className="auth-text-input auth-code-input"
                        autoFocus
                      />
                    </div>
                  </label>

                  {error && <p className="auth-error">{error}</p>}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="auth-primary-button group"
                    whileHover={!loading ? { y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                  >
                    <span>{loading ? '验证中...' : '登录'}</span>
                    <ArrowRight size={18} strokeWidth={1.55} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pt-1 text-[13px]">
                    <button
                      type="button"
                      onClick={() => handleSendCode(phone)}
                      disabled={countdown > 0 || loading}
                      className="auth-footer-link disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      {countdown > 0 ? `${countdown}s 后可重发` : '重新发送'}
                    </button>
                    <span className="text-white/14">|</span>
                    <button
                      type="button"
                      onClick={() => { resetForm(); setQuickLogin(false); }}
                      className="auth-footer-link"
                    >
                      更换手机号
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
