import React from 'react';
import { Layers, CheckCircle2, LayoutGrid, ShieldCheck, Database } from 'lucide-react';
import { ResourceSummaryStats } from '../../types/resource';

interface ResourceSummaryCardsProps {
  stats: ResourceSummaryStats;
}

export const ResourceSummaryCards: React.FC<ResourceSummaryCardsProps> = ({ stats }) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Resources',
      value: stats.total,
      subtext: 'Catalogued campus assets',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      accentBg: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'available',
      label: 'Available Now',
      value: stats.available,
      subtext: 'Ready for immediate booking',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      accentBg: 'bg-emerald-50 border-emerald-100',
      valueColor: 'text-emerald-700',
      indicator: 'bg-emerald-500 animate-pulse',
    },
    {
      id: 'categories',
      label: 'Resource Categories',
      value: stats.categoriesCount,
      subtext: 'Labs, media, tools & compute',
      icon: <LayoutGrid className="w-5 h-5 text-cyan-600" />,
      accentBg: 'bg-cyan-50 border-cyan-100',
    },
    {
      id: 'verification',
      label: 'Requires Verification',
      value: stats.requiresVerificationCount,
      subtext: 'Specialized lab training needed',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      accentBg: 'bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
          Campus Inventory Snapshot
        </span>
        {stats.isBackendGenerated ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
            <Database className="w-3 h-3 text-emerald-600" />
            PostgreSQL & FastAPI Live Data
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Offline Demo Data (Not synced)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle hover:shadow-card transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span
                    className={`text-2xl font-extrabold tracking-tight ${
                      card.valueColor || 'text-slate-900'
                    }`}
                  >
                    {card.value}
                  </span>
                  {card.indicator && (
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${card.indicator}`}
                      title="Active"
                    />
                  )}
                </div>
              </div>
              <div
                className={`p-2.5 rounded-lg border ${card.accentBg} flex items-center justify-center shrink-0`}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
              {card.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
