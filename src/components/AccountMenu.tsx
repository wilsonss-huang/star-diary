import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Repeat2, ShieldCheck, UserRound } from 'lucide-react';

interface AccountMenuProps {
  phone: string;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

function stripChinaPrefix(phone: string) {
  return phone.replace(/^\+86/, '');
}

function maskPhone(phone: string) {
  const normalized = stripChinaPrefix(phone);
  if (normalized.length < 7) return phone || '未登录';
  return `+86 ${normalized.slice(0, 3)} **** ${normalized.slice(-4)}`;
}

function avatarLabel(phone: string) {
  const normalized = stripChinaPrefix(phone);
  return normalized.slice(-2) || '我';
}

export default function AccountMenu({ phone, onLogout, onSwitchAccount }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleSwitchAccount = () => {
    setIsOpen(false);
    onSwitchAccount();
  };

  return (
    <div ref={menuRef} className="absolute right-7 top-6 z-50">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="group relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/[0.11]
                   bg-[#0a0d21]/58 backdrop-blur-2xl transition-all hover:border-white/22
                   hover:bg-white/[0.09] active:scale-95"
        style={{
          boxShadow: '0 14px 42px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
        title="账号"
      >
        <span
          className="absolute inset-1 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.30), rgba(116,139,232,0.18) 42%, rgba(20,24,48,0.20) 100%)',
          }}
        />
        <span className="relative text-sm font-semibold tracking-wide text-white/92">
          {avatarLabel(phone)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-5 w-[380px] overflow-hidden rounded-[30px] border border-white/[0.09]
                       bg-[#080b1b]/84 backdrop-blur-3xl"
            style={{
              boxShadow: '0 28px 92px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="border-b border-white/[0.06] p-6">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/[0.10]"
                  style={{
                    background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.24), rgba(98,120,210,0.18) 46%, rgba(8,12,28,0.72) 100%)',
                  }}
                >
                  <UserRound size={28} className="text-white/74" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-tight text-white/92">个人账号</p>
                  <p className="mt-2 truncate text-[15px] text-white/44">{maskPhone(phone)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-3xl border border-white/[0.055] bg-white/[0.035] px-4 py-4">
                  <p className="text-xs text-white/34">同步状态</p>
                  <p className="mt-2 text-[15px] font-medium text-white/78">已登录</p>
                </div>
                <div className="rounded-3xl border border-white/[0.055] bg-white/[0.035] px-4 py-4">
                  <p className="text-xs text-white/34">账号区域</p>
                  <p className="mt-2 text-[15px] font-medium text-white/78">+86</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center gap-2 px-4 py-2 text-xs text-white/30">
                <ShieldCheck size={14} strokeWidth={1.5} />
                <span>账户操作</span>
              </div>
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="flex min-h-[52px] w-full items-center gap-4 rounded-3xl px-5 text-left text-white/64
                           transition-all hover:bg-white/[0.06] hover:text-white/92"
              >
                <Repeat2 size={18} strokeWidth={1.6} />
                <span className="text-[15px]">切换账号</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex min-h-[52px] w-full items-center gap-4 rounded-3xl px-5 text-left text-red-300/62
                           transition-all hover:bg-red-500/[0.08] hover:text-red-200/92"
              >
                <LogOut size={18} strokeWidth={1.6} />
                <span className="text-[15px]">退出登录</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
