import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { sendCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const verifyOtpRef = useRef<(code: string) => Promise<void>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

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

  const handleSendCode = async () => {
    setError('');
    const phoneNum = phone.trim();

    // 中国大陆手机号 11 位
    if (!/^1[3-9]\d{9}$/.test(phoneNum)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const result = await sendCode(`+86${phoneNum}`);
      verifyOtpRef.current = result.verifyOtp;
      setCodeSent(true);
      startCountdown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '发送失败';
      setError(msg);
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
      // 登录成功，AuthContext 会自动更新 currentUser
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '验证失败';
      setError(msg);
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

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#060618]">
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => {
          const size = Math.random() * 2 + 1;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 3;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                top: `${top}%`,
                opacity: 0.3 + Math.random() * 0.5,
                animation: `twinkle ${2 + Math.random() * 3}s ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      <motion.div
        className="glass-strong rounded-2xl p-8 w-full max-w-sm mx-4 z-10"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌟</div>
          <h1 className="text-white text-2xl font-semibold">星空日记</h1>
          <p className="text-white/30 text-sm mt-1">
            {codeSent ? '输入验证码完成登录' : '使用手机号登录，数据跨设备同步'}
          </p>
        </div>

        {!codeSent ? (
          /* 第一步：输入手机号 */
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 focus-within:bg-white/8 transition-all">
              <span className="text-white/40 text-sm shrink-0">+86</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                className="flex-1 bg-transparent text-white placeholder-white/25 outline-none"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium transition-all cursor-pointer
                         bg-indigo-500/20 border border-indigo-500/30 text-white
                         hover:bg-indigo-500/30 hover:border-indigo-500/50
                         active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </form>
        ) : (
          /* 第二步：输入验证码 */
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <p className="text-white/50 text-xs text-center">
              验证码已发送至 <span className="text-white/70">+86 {phone}</span>
            </p>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位验证码"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest
                         rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/25 outline-none
                         focus:border-white/30 focus:bg-white/8 transition-all"
              autoFocus
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium transition-all cursor-pointer
                         bg-indigo-500/20 border border-indigo-500/30 text-white
                         hover:bg-indigo-500/30 hover:border-indigo-500/50
                         active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '验证中...' : '登录'}
            </button>

            <div className="flex gap-3 text-sm justify-center">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                className="text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={resetForm}
                className="text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              >
                更换手机号
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
