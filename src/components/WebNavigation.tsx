import { BookOpenText, Compass, PenLine, Sparkles, UserRound } from 'lucide-react';
import { StarLogo } from './Icons';

export type AppView = 'atlas' | 'diaries' | 'profile';

interface WebNavigationProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onWrite: () => void;
}

const items: Array<{ view: AppView; label: string; mobileLabel: string; Icon: typeof Compass }> = [
  { view: 'atlas', label: '记忆星图', mobileLabel: '星图', Icon: Compass },
  { view: 'diaries', label: '日记列表', mobileLabel: '日记', Icon: BookOpenText },
  { view: 'profile', label: '个人中心', mobileLabel: '我的', Icon: UserRound },
];

export default function WebNavigation({ activeView, onNavigate, onWrite }: WebNavigationProps) {
  return (
    <>
      <header className="celestial-header">
        <button type="button" className="celestial-wordmark" onClick={() => onNavigate('atlas')}>
          <StarLogo size={25} />
          <span>星空日记</span>
        </button>

        <nav className="celestial-desktop-nav" aria-label="主导航">
          {items.map(({ view, label }) => (
            <button
              key={view}
              type="button"
              className={activeView === view ? 'is-active' : ''}
              onClick={() => onNavigate(view)}
            >
              {label}
            </button>
          ))}
        </nav>

        <button type="button" className="celestial-create-button" onClick={onWrite}>
          <Sparkles size={16} strokeWidth={1.7} />
          <span>创建日记</span>
        </button>
      </header>

      <nav className="celestial-mobile-dock" aria-label="移动端主导航">
        {items.slice(0, 2).map(({ view, mobileLabel, Icon }) => (
          <button key={view} type="button" className={activeView === view ? 'is-active' : ''} onClick={() => onNavigate(view)}>
            <Icon size={18} strokeWidth={1.65} />
            <span>{mobileLabel}</span>
          </button>
        ))}
        <button type="button" className="celestial-mobile-write" onClick={onWrite} aria-label="创建日记">
          <PenLine size={19} strokeWidth={1.8} />
        </button>
        {items.slice(2).map(({ view, mobileLabel, Icon }) => (
          <button key={view} type="button" className={activeView === view ? 'is-active' : ''} onClick={() => onNavigate(view)}>
            <Icon size={18} strokeWidth={1.65} />
            <span>{mobileLabel}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
