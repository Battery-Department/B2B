'use client'

import Script from 'next/script'

// Replace with your actual Clarity Project ID
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'YOUR_PROJECT_ID'

export default function MicrosoftClarity() {
  if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID === 'YOUR_PROJECT_ID') {
    console.warn('Microsoft Clarity Project ID not set')
    return null
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  )
}