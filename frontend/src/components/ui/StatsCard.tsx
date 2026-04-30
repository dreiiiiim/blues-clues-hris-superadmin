interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-3xl font-semibold text-slate-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
