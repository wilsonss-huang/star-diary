import { ChevronRight, Cloud, LogOut, Palette, ShieldCheck, Sparkles, Star, SwitchCamera, UserRound } from 'lucide-react';
import type { DiaryEntry } from '../types';

interface ProfileViewProps {
  phone: string;
  diaries: DiaryEntry[];
  onLogout: () => void;
  onSwitchAccount: () => void;
  onNavigateToAtlas: () => void;
}

function displayPhone(phone: string) {
  const raw = phone.replace(/^\+86/, '');
  return raw.length >= 7 ? `+86 ${raw.slice(0, 3)} **** ${raw.slice(-4)}` : phone || '星际旅人';
}

export default function ProfileView({ phone, diaries, onLogout, onSwitchAccount, onNavigateToAtlas }: ProfileViewProps) {
  const bookmarked = diaries.filter((diary) => diary.isBookmarked).length;
  const currentYear = new Date().getFullYear();

  return (
    <main className="celestial-page celestial-profile-page">
      <section className="celestial-profile-hero">
        <div className="celestial-avatar"><UserRound size={38} strokeWidth={1.3} /></div>
        <p className="celestial-kicker">PRIVATE MEMORY ATLAS</p>
        <h1>星际旅人</h1>
        <p>{displayPhone(phone)}</p>
      </section>

      <section className="celestial-stat-grid" aria-label="日记统计">
        <div><strong>{diaries.length}</strong><span>记录星辰</span></div>
        <div><strong>{bookmarked}</strong><span>珍藏回忆</span></div>
        <div><strong>{currentYear}</strong><span>记忆纪元</span></div>
      </section>

      <section className="celestial-profile-columns">
        <div className="celestial-profile-card celestial-achievement-card">
          <div className="celestial-section-title"><h2>记忆星图</h2><button type="button" onClick={onNavigateToAtlas}>进入星图 <ChevronRight size={16} /></button></div>
          <div className="celestial-achievement-row"><Sparkles size={20} /><div><strong>每篇日记都是一颗星</strong><span>点击星图中的星辰，重温你的回忆</span></div><ChevronRight size={17} /></div>
          <div className="celestial-achievement-row"><Star size={20} /><div><strong>{bookmarked} 颗珍藏星辰</strong><span>你标记过的特别记忆</span></div><ChevronRight size={17} /></div>
        </div>

        <div className="celestial-profile-card celestial-setting-list">
          <button type="button"><Palette size={20} /><span>星图主题<small>星尘金</small></span><ChevronRight size={18} /></button>
          <button type="button"><ShieldCheck size={20} /><span>隐私保护<small>云端数据已加密同步</small></span><ChevronRight size={18} /></button>
          <button type="button"><Cloud size={20} /><span>记忆备份<small>已连接云端</small></span><ChevronRight size={18} /></button>
          <button type="button" onClick={onSwitchAccount}><SwitchCamera size={20} /><span>切换账户<small>使用另一手机号登录</small></span><ChevronRight size={18} /></button>
          <button type="button" className="is-danger" onClick={onLogout}><LogOut size={20} /><span>退出当前星系<small>安全退出此设备</small></span><ChevronRight size={18} /></button>
        </div>
      </section>
    </main>
  );
}
