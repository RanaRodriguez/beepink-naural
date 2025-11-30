interface SectionHeaderProps {
  title: string;
  color: 'pink' | 'purple' | 'teal' | 'blue' | 'white';
}

export function SectionHeader({ title, color }: SectionHeaderProps) {
  const colorClasses = {
    pink: 'text-pink-300',
    purple: 'text-purple-300',
    teal: 'text-teal-300',
    blue: 'text-blue-300',
    white: 'text-white',
  };

  return (
    <h2 className={`${colorClasses[color]} font-semibold text-sm uppercase tracking-wide`}>
      {title}
    </h2>
  );
}

