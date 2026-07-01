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

          // 4. Update Live Chat (Crisp)
          const showLiveChat = settings.show_live_chat !== 'false';

          // CSS Injection for absolute hide safety
          const styleId = 'crisp-custom-style';
          let styleEl = document.getElementById(styleId);

          if (showLiveChat) {
            // Inject custom smaller size CSS
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = styleId;
              styleEl.innerHTML = `
                #crisp-client iframe {
                  width: 380px !important;
                  height: 760px !important;
                  max-width: 380px !important;
                  max-height: 760px !important;
                  bottom: 20px !important;
                  right: 20px !important;
                  transform: scale(0.4) !important;
                  transform-origin: bottom right !important;
                }
              `;
              document.head.appendChild(styleEl);
            }

            if (!(window as any).$crisp) {
              (window as any).$crisp = [];
              (window as any).CRISP_WEBSITE_ID = "c4d01693-660f-4bea-90ff-23fa037cb36e";
              const d = document;
              const s = d.createElement("script");
              s.src = "https://client.crisp.chat/l.js";
              s.async = true;
              d.getElementsByTagName("head")[0].appendChild(s);

              // Force it to remain collapsed (closed) on load
              (window as any).$crisp.push(["do", "chat:close"]);
            } else {
              try {
                (window as any).$crisp.push(["do", "chat:show"]);
                (window as any).$crisp.push(["do", "chat:close"]);
              } catch (err) { }
            }
          } else {
            // Force CSS hide
            if (styleEl) styleEl.remove();

            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.innerHTML = '.crisp-client, #crisp-client { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
            document.head.appendChild(styleEl);

            if ((window as any).$crisp) {
              try {
                (window as any).$crisp.push(["do", "chat:hide"]);
              } catch (err) { }
            }
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
