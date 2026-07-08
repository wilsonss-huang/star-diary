import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuth } from '../contexts/AuthContext';
// (StarLogo moved to inline SVG cross star)

// ── Three.js flowing galaxy background ──

function GalaxyParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 1500;

  const { positions, colors } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 8 + Math.random() * 22;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 20;
      p[i * 3] = Math.cos(angle) * radius;
      p[i * 3 + 1] = height;
      p[i * 3 + 2] = Math.sin(angle) * radius;
      const t = Math.random();
      c[i * 3] = 0.55 + t * 0.35;
      c[i * 3 + 1] = 0.5 + t * 0.3;
      c[i * 3 + 2] = 0.45 + t * 0.55;
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
    const s = 32;
    const canvas = document.createElement('canvas');
    canvas.width = s; canvas.height = s;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.15, 'rgba(200,220,255,0.85)');
    grad.addColorStop(0.4, 'rgba(140,170,255,0.25)');
    grad.addColorStop(1, 'rgba(80,120,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.025;
    ref.current.rotation.x = Math.sin(t * 0.015) * 0.06;
    (ref.current.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(t * 0.3) * 0.08;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial map={tex} size={0.1} vertexColors transparent
        blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.55} />
    </points>
  );
}

// ── Main component ──

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

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

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
      setPhone(phoneNum); // always sync phone state
      setCodeSent(true);
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) { setError('请输入验证码'); return; }
    if (!verifyOtpRef.current) { setError('请先获取验证码'); return; }
    setLoading(true);
    try {
      await verifyOtpRef.current(code.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setCodeSent(false); setCode(''); setPhone(''); setError(''); setCountdown(0);
    verifyOtpRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSwitchAccount = () => {
    clearRemembered();
    setQuickLogin(false);
    resetForm();
  };

  // 记忆手机号脱敏显示: 138****1234 (strip +86 prefix)
  const rawRemembered = rememberedPhone?.replace(/^\+86/, '') || '';
  const maskedPhone = rawRemembered
    ? `${rawRemembered.slice(0, 3)}****${rawRemembered.slice(-4)}`
    : '';

  // ── 一键登录：免输手机号，直接发验证码 ──
  const handleQuickLogin = () => {
    if (rawRemembered) handleSendCode(rawRemembered);
  };

  console.log('🔵 [AuthScreen V21] 按钮居中 + 文字提亮');

  // SVG noise texture for glass grain
  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

  // Shared glass input styles
  const glassInputBase = {
    background: 'rgba(255,255,255,0.025)',
    borderColor: 'rgba(255,255,255,0.06)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.015)',
  };
  const glassInputFocus = {
    background: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(170,200,255,0.28)',
    boxShadow: '0 0 24px rgba(130,170,255,0.12), 0 0 6px rgba(150,190,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#050a18]">
      {/* Galaxy background */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 55 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#050a18']} />
          <GalaxyParticles />
        </Canvas>
      </div>

      {/* Soft ambient halos — layered for depth */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        {/* Outer wide glow */}
        <div
          className="w-[600px] h-[600px] rounded-full absolute"
          style={{
            background: 'radial-gradient(circle, rgba(140,180,255,0.04) 0%, rgba(100,140,220,0.015) 40%, transparent 65%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Inner subtle glow */}
        <div
          className="w-[350px] h-[350px] rounded-full absolute"
          style={{
            background: 'radial-gradient(circle, rgba(160,200,255,0.05) 0%, rgba(120,160,240,0.02) 50%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Login card */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          className="w-full max-w-[400px] mx-4"
          initial={{ scale: 0.92, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 140, mass: 0.8 }}
        >
          {/* ── Liquid Glass card — deep refinement ── */}
          <div
            className="rounded-[6px] px-10 py-10 min-h-[430px]
                       flex flex-col items-center
                       backdrop-blur-xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(165deg, rgba(210,220,250,0.06) 0%, rgba(150,170,220,0.035) 30%, rgba(100,130,190,0.015) 60%, rgba(160,185,230,0.04) 100%)',
              boxShadow: [
                '0 0 120px rgba(120,160,240,0.06)',
                '0 0 60px rgba(100,140,220,0.04)',
                '0 4px 24px rgba(0,0,0,0.05)',
                'inset 0 1px 0 rgba(255,255,255,0.08)',
                'inset 0 0 0 1px rgba(255,255,255,0.04)',
              ].join(', '),
              backgroundImage: noiseSvg,
            }}
            data-v12="2026-07-08-star-brand"
          >
            {/* ── Decorative: scattered star particles ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[6px]">
              {[
                { top: '8%', left: '14%', size: 2, delay: 0, dur: 3.2 },
                { top: '18%', right: '10%', size: 1.5, delay: 1.1, dur: 3.8 },
                { top: '35%', left: '6%', size: 2.5, delay: 0.5, dur: 4.1 },
                { top: '50%', right: '14%', size: 2, delay: 1.7, dur: 3.5 },
                { top: '62%', left: '10%', size: 1.8, delay: 2.3, dur: 4.4 },
                { top: '75%', right: '8%', size: 2.2, delay: 0.9, dur: 3.6 },
                { top: '85%', left: '18%', size: 1.5, delay: 1.4, dur: 4.0 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    top: p.top, left: p.left, right: p.right,
                    width: p.size, height: p.size,
                    background: 'rgba(195,220,255,0.5)',
                    boxShadow: `0 0 ${p.size * 3}px rgba(185,215,250,0.25)`,
                  }}
                  animate={{ opacity: [0.06, 0.28, 0.06] }}
                  transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
                />
              ))}
            </div>

            {/* ── Header ── */}
            <div className="text-center mb-4">
              {/* Cross star with breathing glow */}
              <motion.div
                className="inline-flex items-center justify-center mb-4 relative"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Outer breathing halo */}
                <motion.div
                  className="absolute rounded-full"
                  animate={{
                    opacity: [0.1, 0.25, 0.1],
                    scale: [1.0, 1.25, 1.0],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 90, height: 90,
                    background: 'radial-gradient(circle, rgba(160,200,255,0.5) 0%, transparent 70%)',
                    filter: 'blur(25px)',
                  }}
                />
                {/* Mid glow ring */}
                <motion.div
                  className="absolute rounded-full"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  style={{
                    width: 55, height: 55,
                    background: 'radial-gradient(circle, rgba(200,220,255,0.4) 0%, transparent 60%)',
                    filter: 'blur(10px)',
                  }}
                />

                {/* ── Cross star SVG — 4-pointed sparkle ── */}
                <motion.svg
                  width="36" height="36" viewBox="0 0 48 48" fill="none"
                  className="relative"
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Outer faint cross glow */}
                  <path
                    d="M24 2l3 19 19 3-19 3-3 19-3-19L2 24l19-3z"
                    fill="rgba(180,210,255,0.12)"
                  />
                  {/* Main cross star */}
                  <path
                    d="M24 6l2.5 15.5L42 24l-15.5 2.5L24 42l-2.5-15.5L6 24l15.5-2.5z"
                    fill="rgba(200,220,255,0.65)"
                  />
                  {/* Inner bright cross */}
                  <path
                    d="M24 10l2 12 12 2-12 2-2 12-2-12L10 24l12-2z"
                    fill="rgba(225,238,255,0.85)"
                  />
                  {/* Center spark */}
                  <circle cx="24" cy="24" r="3" fill="white" opacity="0.9" />
                </motion.svg>
              </motion.div>

              {/* Title with star decorations */}
              <h1 className="text-white/90 text-[16px] font-light tracking-[0.3em] flex items-center justify-center gap-2.5">
                <svg width="8" height="8" viewBox="0 0 10 10" className="opacity-30">
                  <path d="M5 0l1.2 3.8H10L6.8 6.2 8 10 5 7.8 2 10l1.2-3.8L0 3.8h3.8z" fill="rgba(200,215,255,0.8)"/>
                </svg>
                星空日记
                <svg width="8" height="8" viewBox="0 0 10 10" className="opacity-30">
                  <path d="M5 0l1.2 3.8H10L6.8 6.2 8 10 5 7.8 2 10l1.2-3.8L0 3.8h3.8z" fill="rgba(200,215,255,0.8)"/>
                </svg>
              </h1>
              {/* Subtitle */}
              <p className="text-[#b0c8e0]/55 text-[11px] mt-2 leading-relaxed tracking-[0.1em]">
                每段回忆，化作夜空中的一颗星
              </p>
            </div>

            {/* Decorative constellation divider */}
            <div className="flex items-center gap-3 mb-4 w-full max-w-[240px] mx-auto">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(170,195,235,0.12), rgba(170,195,235,0.12))' }} />
              <div className="flex gap-2.5">
                {[0.6, 1, 0.7].map((scale, i) => (
                  <div key={i} className="rounded-full"
                    style={{
                      width: `${2.5 * scale}px`, height: `${2.5 * scale}px`,
                      background: 'rgba(190,210,250,0.35)',
                      boxShadow: '0 0 4px rgba(180,200,245,0.25)',
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(170,195,235,0.12), rgba(170,195,235,0.12), transparent)' }} />
            </div>

            {/* ── Quick login (matching glass style) ── */}
            {quickLogin && rememberedPhone && !codeSent && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-white/50 text-[11px] tracking-wide">欢迎回来</p>
                </div>

                {/* Masked phone display — same glass style as input */}
                <div className="relative w-full max-w-[220px] mx-auto">
                  <div
                    className="flex items-center rounded-[4px]"
                    style={glassInputBase}
                  >
                    <span
                      className="text-white/40 text-[11px] pl-2.5 pr-2 py-1 shrink-0 select-none font-light rounded-l-[4px]"
                      style={{ background: 'rgba(255,255,255,0.015)' }}
                    >
                      +86
                    </span>
                    <span className="w-px h-3 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="flex-1 text-white/75 text-[14px] font-light tracking-[0.15em] px-2 py-1">
                      {maskedPhone}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400/45 text-[11px] text-center">{error}</p>
                )}

                {/* One-click login button — same glass style as get-code */}
                <div className="pt-1 w-full max-w-[160px] mx-auto">
                  <motion.button
                    type="button"
                    disabled={loading}
                    onClick={handleQuickLogin}
                    className="relative w-full py-2 rounded-[4px] font-normal text-[12px]
                               transition-all cursor-pointer overflow-hidden
                               disabled:opacity-30 disabled:cursor-not-allowed
                               text-white/85 tracking-[0.15em]"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 2px 20px rgba(100,140,220,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    whileHover={!loading ? {
                      scale: 1.015,
                      boxShadow: '0 4px 28px rgba(110,150,230,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                    } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    <div className="absolute inset-0 rounded-[4px]" style={{
                      background: 'linear-gradient(135deg, rgba(110,140,225,0.2) 0%, rgba(140,170,245,0.16) 45%, rgba(165,195,255,0.2) 100%)',
                    }} />
                    <div className="absolute inset-x-0 top-0 h-[55%] rounded-[4px]" style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)',
                    }} />
                    <span className="relative z-10">{loading ? '登录中...' : '一键登录'}</span>
                  </motion.button>
                </div>

                <button type="button" onClick={handleSwitchAccount}
                  className="text-[#a0b8d8]/38 hover:text-[#c0d0e8]/55 text-[11px] transition-colors cursor-pointer text-center">
                  切换账号
                </button>
              </div>
            )}

            {/* ── Normal login: phone input ── */}
            {!codeSent && !quickLogin && (
              <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}
                className="flex-1 flex flex-col items-center justify-center gap-4"
              >
                {/* Phone input */}
                <div className="relative w-full max-w-[220px] mx-auto">
                  <div
                    className="flex items-center rounded-[4px] transition-all duration-300"
                    style={focusedField === 'phone' ? glassInputFocus : glassInputBase}
                  >
                    {/* +86 prefix — subtly separated */}
                    <span
                      className="text-white/40 text-[11px] pl-2.5 pr-2 py-1 shrink-0 select-none font-light rounded-l-[4px]"
                      style={{
                        background: focusedField === 'phone'
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      +86
                    </span>
                    {/* Subtle divider */}
                    <span className="w-px h-3 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="输入手机号"
                      className="flex-1 bg-transparent text-white/80 text-[12px] placeholder-white/20
                                 outline-none px-2 py-1 font-light"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400/45 text-[11px] text-center">{error}</p>
                )}

                {/* Get code button */}
                <div className="pt-1 w-full max-w-[160px] mx-auto">
                  <motion.button
                    type="submit" disabled={loading}
                    className="relative w-full py-2 rounded-[4px] font-normal text-[12px]
                               transition-all cursor-pointer overflow-hidden
                               disabled:opacity-30 disabled:cursor-not-allowed
                               text-white/85 tracking-[0.15em]"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 2px 20px rgba(100,140,220,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    whileHover={!loading ? {
                      scale: 1.015,
                      boxShadow: '0 4px 28px rgba(110,150,230,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                    } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    <div className="absolute inset-0 rounded-[4px]" style={{
                      background: 'linear-gradient(135deg, rgba(110,140,225,0.2) 0%, rgba(140,170,245,0.16) 45%, rgba(165,195,255,0.2) 100%)',
                    }} />
                    <div className="absolute inset-x-0 top-0 h-[55%] rounded-[4px]" style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)',
                    }} />
                    <span className="relative z-10">{loading ? '发送中...' : '获取验证码'}</span>
                  </motion.button>
                </div>

                {rememberedPhone && (
                  <button type="button" onClick={() => { resetForm(); setQuickLogin(true); }}
                    className="text-[#a0b8d8]/38 hover:text-[#c0d0e8]/55 text-[11px] transition-colors cursor-pointer text-center">
                    ← 返回快速登录
                  </button>
                )}
              </form>
            )}

            {/* ── Code verification ── */}
            {codeSent && (
              <form onSubmit={handleVerify} className="flex-1 flex flex-col items-center gap-4">
                {/* Top spacer — pushes content down to center */}
                <div className="flex-1" />

                <p className="text-[#b0c8e0]/50 text-[11px] text-center leading-relaxed tracking-wide mb-1">
                  验证码已发送至 <span className="text-[#c8d8f0]/65">+86 {phone || rememberedPhone}</span>
                </p>

                {/* Code input */}
                <div className="relative w-full max-w-[220px] mx-auto mt-1">
                  <div
                    className="rounded-[4px] transition-all duration-300"
                    style={focusedField === 'code' ? glassInputFocus : glassInputBase}
                  >
                    <input
                      type="text" value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={() => setFocusedField('code')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="输入 6 位验证码"
                      className="w-full bg-transparent text-white/80 text-center text-base font-light
                                 tracking-[0.5em] placeholder-white/20 outline-none py-2.5"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400/45 text-[11px] text-center">{error}</p>
                )}

                {/* Login button */}
                <div className="pt-4 w-full max-w-[160px] mx-auto">
                  <motion.button
                    type="submit" disabled={loading}
                    className="relative w-full py-2 rounded-[4px] font-normal text-[12px]
                               transition-all cursor-pointer overflow-hidden
                               disabled:opacity-30 disabled:cursor-not-allowed
                               text-white/85 tracking-[0.15em]"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 2px 20px rgba(100,140,220,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    whileHover={!loading ? {
                      scale: 1.015,
                      boxShadow: '0 4px 28px rgba(110,150,230,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                    } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    <div className="absolute inset-0 rounded-[4px]" style={{
                      background: 'linear-gradient(135deg, rgba(110,140,225,0.2) 0%, rgba(140,170,245,0.16) 45%, rgba(165,195,255,0.2) 100%)',
                    }} />
                    <div className="absolute inset-x-0 top-0 h-[55%] rounded-[4px]" style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)',
                    }} />
                    <span className="relative z-10">{loading ? '验证中...' : '登 录'}</span>
                  </motion.button>
                </div>

                {/* Footer links */}
                <div className="flex gap-5 text-[11px] justify-center pt-3">
                  <button type="button" onClick={() => handleSendCode(phone)}
                    disabled={countdown > 0 || loading}
                    className="text-[#a0b8d8]/40 hover:text-[#c0d0e8]/58 transition-colors cursor-pointer
                               disabled:opacity-15 disabled:cursor-not-allowed">
                    {countdown > 0 ? `${countdown}s 后可重发` : '重新发送'}
                  </button>
                  <span className="text-white/15">|</span>
                  <button type="button" onClick={() => { resetForm(); setQuickLogin(false); }}
                    className="text-[#a0b8d8]/40 hover:text-[#c0d0e8]/58 transition-colors cursor-pointer">
                    更换手机号
                  </button>
                </div>

                {/* Bottom spacer — balances top spacer to center content */}
                <div className="flex-1" />
              </form>
            )}

            {/* ── Bottom constellation accent (absolute, doesn't affect centering) ── */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(170,195,235,0.10))' }} />
                <svg width="3" height="3" viewBox="0 0 10 10" className="opacity-[0.15]">
                  <path d="M5 0l1.2 3.8H10L6.8 6.2 8 10 5 7.8 2 10l1.2-3.8L0 3.8h3.8z" fill="rgba(200,215,255,0.8)"/>
                </svg>
                <div className="w-10 h-px" style={{ background: 'linear-gradient(90deg, rgba(170,195,235,0.10), transparent)' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
