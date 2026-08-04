import React, { useState, useEffect } from 'react';
import { subscribeDemoMode } from '../api/client';
import { WifiOff } from 'lucide-react';

const DemoBanner = () => {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDemoMode(setIsDemo);
    return () => unsubscribe();
  }, []);

  if (!isDemo) return null;

  return (
    <div 
      data-testid="demo-mode-banner"
      className="w-full px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold animate-slide-up sticky top-0 z-50 shadow-md"
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
        color: '#080c14',
      }}
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>Demo Mode — backend unreachable, showing sample data</span>
    </div>
  );
};

export default DemoBanner;
