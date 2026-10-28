import React from 'react';
import { Search, X } from 'lucide-react';

interface ResourceSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ResourceSearch: React.FC<ResourceSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by equipment name, model, specs, department, or location...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <label htmlFor="resource-search-input" className="sr-only">
        Search campus resources
      </label>
      <div className="absolute left-3.5 pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="resource-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-subtle focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500 transition-all duration-150"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
