import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-850 ${className}`} 
    />
  );
};
export default Skeleton;
