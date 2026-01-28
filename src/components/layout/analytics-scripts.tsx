import Script from "next/script";
import { getMetaPixelConfig } from "@/lib/app-settings";
import { MetaPixelClient } from "@/components/analytics/meta-pixel-client";
import { FirebaseAnalyticsClient } from "@/components/analytics/firebase-analytics-client";

export async function AnalyticsScripts() {
  const { enabled, pixelId } = await getMetaPixelConfig();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {/* Google Analytics */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {enabled && pixelId && (() => {
        const cleanedId = pixelId.trim();
        if (!cleanedId) return null;

        return (
          <>
            <Script
              id="meta-pixel-base"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${cleanedId}');
fbq('track', 'PageView');
                `.trim(),
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${encodeURIComponent(cleanedId)}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
            <MetaPixelClient enabled />
          </>
        );
      })()}

      {/* Firebase Analytics */}
      <FirebaseAnalyticsClient />
    </>
  );
}

