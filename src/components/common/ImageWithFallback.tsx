import React, { useState } from 'react';
import { Package, Cpu, Camera, Wrench, Monitor, Microscope } from 'lucide-react';
import { ResourceCategory } from '../../types/resource';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: ResourceCategory;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackCategory,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getCategoryIcon = () => {
    switch (fallbackCategory) {
      case 'Laboratory Equipment':
        return <Microscope className="w-12 h-12 text-slate-400 stroke-1" />;
      case 'Computers & Electronics':
        return <Cpu className="w-12 h-12 text-slate-400 stroke-1" />;
      case 'Cameras & Media':
        return <Camera className="w-12 h-12 text-slate-400 stroke-1" />;
      case 'Engineering Tools':
        return <Wrench className="w-12 h-12 text-slate-400 stroke-1" />;
      case 'Presentation Equipment':
        return <Monitor className="w-12 h-12 text-slate-400 stroke-1" />;
      default:
        return <Package className="w-12 h-12 text-slate-400 stroke-1" />;
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 flex items-center justify-center ${containerClassName}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-slate-200/60 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-campus-600 rounded-full animate-spin" />
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 h-full w-full bg-gradient-to-b from-slate-50 to-slate-100">
          {getCategoryIcon()}
          <span className="text-xs mt-2 font-medium text-slate-500">
            {fallbackCategory || 'Campus Equipment'}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...rest}
        />
      )}
    </div>
  );
};
