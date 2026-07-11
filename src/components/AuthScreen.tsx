import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Globe2, Phone, RotateCcw, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

function makeStars() {
  return Array.from({ length: 130 }, (_, index) => ({
    left: `${(index * 73 + 17) % 100}%`,
    top: `${(index * 37 + 29) % 100}%`,
    size: 1 + (index % 3) * .55,
    delay: `${(index % 11) * .38}s`,
  }));
}

export default function AuthScreen() {
  const { sendCode, rememberedPhone, clearRemembered } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [quickLogin, setQuickLogin] = useState(!!rememberedPhone);
  const verifyOtpRef = useRef<(code: string) => Promise<void>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const stars = useMemo(makeStars, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCountdown((value) => {
      if (value <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
      return value - 1;
    }), 1000);
  };

  const handleSendCode = async (phoneNumber?: string) => {
    setError('');
    const target = (phoneNumber || phone).trim();
    if (!/^1[3-9]\d{9}$/.test(target)) { setError('请输入正确的手机号'); return; }
    setLoading(true);
    try {
      const result = await sendCode(`+86${target}`);
      verifyOtpRef.current = result.verifyOtp;
      setPhone(target);
      setCodeSent(true);
      setQuickLogin(false);
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally { setLoading(false); }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!code.trim()) { setError('请输入验证码'); return; }
    if (!verifyOtpRef.current) { setError('请先获取验证码'); return; }
    setLoading(true);
    try { await verifyOtpRef.current(code.trim()); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : '验证失败'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setCodeSent(false); setCode(''); setPhone(''); setError(''); setCountdown(0); verifyOtpRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const rawRemembered = rememberedPhone?.replace(/^\+86/, '') || '';
  const maskedPhone = rawRemembered ? `${rawRemembered.slice(0, 3)} **** ${rawRemembered.slice(-4)}` : '';

  return (
    <div className="stitch-auth-screen">
      <div className="stitch-auth-nebula" />
      <div className="stitch-auth-stars" aria-hidden="true">
        {stars.map((star, index) => <i key={index} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}
      </div>
      <p className="stitch-auth-side stitch-auth-side-left">OBSERVING THE COSMOS · PRESERVING THE SOUL</p>
      <p className="stitch-auth-side stitch-auth-side-right">INFINITY AND BEYOND · SINCE 2024</p>

      <motion.main className="stitch-auth-main" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <header className="stitch-auth-brand">
          <h1>星空日记</h1>
          <p>SANCTUARY OF MEMORIES</p>
        </header>

        <section className="stitch-auth-card">
          <h2><ShieldCheck size={25} /> 星际身份核验</h2>
          {quickLogin && !codeSent ? (
            <div className="stitch-auth-form">
              <label>已记住的星际通讯号</label>
              <div className="stitch-auth-input"><Phone size={18} /><span>+86 {maskedPhone}</span></div>
              {error && <p className="stitch-auth-error">{error}</p>}
              <button type="button" className="stitch-auth-primary" disabled={loading} onClick={() => handleSendCode(rawRemembered)}>
                {loading ? '正在发送…' : '开启星际之旅'} <ArrowRight size={18} />
              </button>
              <button type="button" className="stitch-auth-link single" onClick={() => { clearRemembered(); setQuickLogin(false); resetForm(); }}>切换账号</button>
            </div>
          ) : (
            <form className="stitch-auth-form" onSubmit={codeSent ? handleVerify : (event) => { event.preventDefault(); handleSendCode(); }}>
              <label htmlFor="stitch-phone">手机号 / MOBILE</label>
              <div className="stitch-auth-input">
                <Globe2 size={18} />
                <span className="stitch-auth-prefix">+86</span>
                <input id="stitch-phone" value={phone} disabled={codeSent} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="请输入您的星际通讯号" inputMode="numeric" autoFocus />
              </div>

              {codeSent && <>
                <label htmlFor="stitch-code">验证码 / CODE</label>
                <div className="stitch-auth-code-row">
                  <div className="stitch-auth-input"><ShieldCheck size={18} /><input id="stitch-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="六位验证码" inputMode="numeric" autoFocus /></div>
                  <button type="button" className="stitch-auth-send" disabled={countdown > 0 || loading} onClick={() => handleSendCode(phone)}>{countdown > 0 ? `${countdown}s 后重发` : '重新发送'}</button>
                </div>
              </>}

              {error && <p className="stitch-auth-error">{error}</p>}
              <button type="submit" className="stitch-auth-primary" disabled={loading}>
                {loading ? '正在连接…' : codeSent ? '开启星际之旅' : '发送验证码'} <ArrowRight size={18} />
              </button>
              {codeSent ? (
                <button type="button" className="stitch-auth-link single" onClick={() => { resetForm(); setQuickLogin(false); }}>更换手机号</button>
              ) : rememberedPhone && (
                <button type="button" className="stitch-auth-link single" onClick={() => { resetForm(); setQuickLogin(true); }}><RotateCcw size={14} /> 返回快捷登录</button>
              )}
            </form>
          )}
        </section>
        <p className="stitch-auth-policy">点击“开启”即代表您同意<br /><a href="#policy">《星际公约》</a> 与 <a href="#privacy">《星辰隐私协议》</a></p>
      </motion.main>
    </div>
  );
}
