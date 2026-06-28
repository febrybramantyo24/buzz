'use client';

import { useEffect, useState, createContext, useContext } from 'react';

interface BrandContextType {
  logoUrl: string;
  brandName: string;
}

const BrandContext = createContext<BrandContextType>({
  logoUrl: '',
  brandName: 'Buzzify'
});

export const useBrand = () => useContext(BrandContext);

export default function DynamicBrandProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState('');
  const [brandName, setBrandName] = useState('Buzzify');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const settings = await res.json();
          
          // 1. Update Title
          if (settings.site_title) {
            document.title = settings.site_title;
            setBrandName(settings.site_title);
          }

          // 2. Update Logo URL
          if (settings.logo_url) {
            setLogoUrl(settings.logo_url);
          }

          // 3. Update Favicon
          if (settings.favicon_url) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = settings.favicon_url;
          }
        }
      } catch (e) {
        console.error('Error loading dynamic brand settings:', e);
      }
    }
    loadSettings();
  }, []);

  return (
    <BrandContext.Provider value={{ logoUrl, brandName }}>
      {children}
    </BrandContext.Provider>
  );
}
