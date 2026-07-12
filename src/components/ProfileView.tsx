import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ChevronRight, Cloud, LogOut, Palette, ShieldCheck, Sparkles, Star, SwitchCamera, UserRound } from 'lucide-react';
import type { DiaryEntry } from '../types';
import { getAvatarFileId, getPhotoUrls, saveAvatar } from '../lib/cloudbase';

interface ProfileViewProps {
  userId: string;
  phone: string;
  diaries: DiaryEntry[];
  onLogout: () => void;
  onSwitchAccount: () => void;
  onNavigateToAtlas: () => void;
  onOpenBookmarked: () => void;
}

function displayPhone(phone: string) {
  const raw = phone.replace(/^\+86/, '');
  return raw.length >= 7 ? `+86 ${raw.slice(0, 3)} **** ${raw.slice(-4)}` : phone || '星际旅人';
}

function makeLocalAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = Math.max(0, (image.naturalWidth - side) / 2);
      const sy = Math.max(0, (image.naturalHeight - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      canvas.getContext('2d')?.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
      URL.revokeObjectURL(sourceUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    image.onerror = () => { URL.revokeObjectURL(sourceUrl); reject(new Error('无法读取这张图片')); };
    image.src = sourceUrl;
  });
}

export default function ProfileView({ userId, phone, diaries, onLogout, onSwitchAccount, onNavigateToAtlas, onOpenBookmarked }: ProfileViewProps) {
  const bookmarked = diaries.filter((diary) => diary.isBookmarked).length;
  const currentYear = new Date().getFullYear();
  const avatarKey = `star-diary-avatar:${userId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');

  useEffect(() => {
    let active = true;
    const loadAvatar = async () => {
      const cached = localStorage.getItem(avatarKey);
      if (cached?.startsWith('data:image/')) {
        if (active) setAvatarUrl(cached);
        return;
      }
      const fileId = cached || await getAvatarFileId();
      if (!fileId) return;
      if (!cached) localStorage.setItem(avatarKey, fileId);
      const [url] = await getPhotoUrls([fileId]);
      if (active && url) setAvatarUrl(url);
    };
    void loadAvatar();
    return () => { active = false; };
  }, [avatarKey]);

  const handleAvatarFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarError('请选择图片文件'); return; }
    if (file.size > 12 * 1024 * 1024) { setAvatarError('图片请控制在 12MB 以内'); return; }

    setAvatarError('');
    setAvatarNotice('');
    setIsSavingAvatar(true);
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    try {
      const fileId = await saveAvatar(file);
      localStorage.setItem(avatarKey, fileId);
      const [url] = await getPhotoUrls([fileId]);
      if (url) setAvatarUrl(url);
    } catch (error) {
      try {
        const localAvatar = await makeLocalAvatar(file);
        localStorage.setItem(avatarKey, localAvatar);
        setAvatarUrl(localAvatar);
        setAvatarNotice('头像已保存到本设备，云端同步暂不可用');
      } catch {
        setAvatarError(error instanceof Error ? error.message : '头像保存失败，请换一张图片重试');
      }
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <main className="celestial-page celestial-profile-page">
      <section className="celestial-profile-hero">
        <button type="button" className="celestial-avatar" onClick={() => inputRef.current?.click()} aria-label="编辑头像" title="点击更换头像">
          {avatarUrl ? <img src={avatarUrl} alt="个人头像" /> : <UserRound size={38} strokeWidth={1.3} />}
          <span className="celestial-avatar-edit"><Camera size={15} /></span>
        </button>
        <input ref={inputRef} className="celestial-avatar-input" type="file" accept="image/*" onChange={handleAvatarFile} />
        <p className="celestial-avatar-hint">{isSavingAvatar ? '正在保存头像…' : '点击头像即可更换'}</p>
        {avatarNotice && <p className="celestial-avatar-notice" role="status">{avatarNotice}</p>}
        {avatarError && <p className="celestial-avatar-error" role="status">{avatarError}</p>}
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
          <button type="button" className="celestial-achievement-row" onClick={onOpenBookmarked}><Star size={20} /><div><strong>{bookmarked} 颗珍藏星辰</strong><span>你标记过的特别记忆</span></div><ChevronRight size={17} /></button>
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
