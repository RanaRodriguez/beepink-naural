import { cx } from '../utils/cx';

interface AppHeaderProps {
  title: string;
  subtitle: string;
  color: 'pink' | 'teal';
}

export function AppHeader({ title, subtitle, color }: AppHeaderProps) {
  const gradientClass = color === 'pink'
    ? 'bg-linear-to-r from-pink-400 to-purple-400'
    : 'bg-linear-to-r from-teal-400 to-blue-400';

  return (
    <>
      <h1 className={cx('text-3xl font-bold text-center mb-2', gradientClass, 'text-transparent bg-clip-text')}>
        {title}
      </h1>
      <p className="text-slate-400 text-center mb-8 text-sm">
        {subtitle}
      </p>
    </>
  );
}

