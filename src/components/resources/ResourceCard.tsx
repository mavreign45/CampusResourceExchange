import React from 'react';
import {
  MapPin,
  Building2,
  Clock,
  ShieldAlert,
  Bookmark,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Resource } from '../../types/resource';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ResourceCardProps {
  resource: Resource;
  onViewDetails: (resource: Resource) => void;
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onViewDetails,
  isSaved = false,
  onToggleSave,
}) => {
  const getStatusBadge = () => {
    switch (resource.status) {
      case 'available':
        return (
          <Badge variant="success" dot size="sm">
            Available Now
          </Badge>
        );
      case 'in_use':
        return (
          <Badge variant="warning" dot size="sm">
            Currently In Use
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="danger" dot size="sm">
            Maintenance
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryBadgeVariant = () => {
    switch (resource.category) {
      case 'Laboratory Equipment':
        return 'primary';
      case 'Computers & Electronics':
        return 'info';
      case 'Cameras & Media':
        return 'default';
      case 'Engineering Tools':
        return 'warning';
      case 'Presentation Equipment':
        return 'subtle';
      default:
        return 'default';
    }
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 overflow-hidden">
      {/* Visual Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        <ImageWithFallback
          src={resource.imageUrl}
          alt={resource.name}
          fallbackCategory={resource.category}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge variant={getCategoryBadgeVariant()} size="sm">
            {resource.category}
          </Badge>
        </div>

        {/* Bookmark Action */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(resource.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all z-10 ${
              isSaved
                ? 'bg-campus-600 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-xs'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save resource'}
            title={isSaved ? 'Saved to bookmarks' : 'Save for later'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Bottom Floating Status on Image */}
        <div className="absolute bottom-2.5 left-3 z-10">
          {getStatusBadge()}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title & Model */}
        <div className="mb-2">
          {resource.modelNumber && (
            <p className="text-[11px] font-mono text-slate-400 font-medium tracking-tight truncate">
              {resource.modelNumber}
            </p>
          )}
          <h4
            className="text-base font-bold text-slate-900 group-hover:text-campus-700 transition-colors line-clamp-1 mt-0.5 cursor-pointer"
            onClick={() => onViewDetails(resource)}
          >
            {resource.name}
          </h4>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {resource.shortDescription}
        </p>

        {/* Metadata Details */}
        <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          {/* Location */}
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <span className="font-medium text-slate-700">
                {resource.location.building}
              </span>
              <span className="text-slate-400"> • {resource.location.room}</span>
            </span>
          </div>

          {/* Department */}
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-slate-500">
              {resource.owner.department}
            </span>
          </div>

          {/* Borrow limit / duration */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500">
              Max duration: <span className="font-medium text-slate-700">{resource.maxBorrowDuration}</span>
            </span>
          </div>

          {/* Verification requirement tag */}
          <div className="pt-1">
            {resource.requiresVerification ? (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1 font-medium">
                  {resource.trainingRequirement || 'Verification Required'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">General Campus Access (No special permit)</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between group-hover:bg-navy-900 group-hover:text-white group-hover:border-navy-950 transition-all duration-200"
            onClick={() => onViewDetails(resource)}
            iconRight={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
          >
            <span>View Resource Details</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
