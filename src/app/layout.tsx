import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { Toaster } from "react-hot-toast";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleTagManager from "@/components/GoogleTagManager";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import ClientLayout from "@/components/ClientLayout";

// Force dynamic rendering for all pages to prevent build timeouts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "RHY Supplier Portal - FlexVolt Battery Operations",
    template: "%s | RHY Supplier Portal"
  },
  description: "Enterprise FlexVolt battery supply chain management across global warehouses. Professional contractors and fleet managers portal for 20V/60V MAX compatible batteries.",
  keywords: [
    "FlexVolt batteries",
    "supplier portal", 
    "battery management",
    "contractor supplies",
    "fleet management",
    "20V 60V MAX",
    "enterprise supply chain"
  ],
  authors: [{ name: "RHY Global Operations", url: "https://rhy-supplier-portal.com" }],
  creator: "RHY Enterprise Systems",
  publisher: "RHY Global Warehouses",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rhy-supplier-portal.com",
    siteName: "RHY Supplier Portal",
    title: "RHY Supplier Portal - FlexVolt Battery Operations",
    description: "Enterprise FlexVolt battery supply chain management across global warehouses",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RHY Supplier Portal Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHY Supplier Portal - FlexVolt Battery Operations",
    description: "Enterprise FlexVolt battery supply chain management",
    images: ["/twitter-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  other: {
    "security-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(self)",
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#006FEE' },
    { media: '(prefers-color-scheme: dark)', color: '#0050B3' }
  ],
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Font loading with display swap for performance */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//api.rhy-portal.com" />
        <link rel="dns-prefetch" href="//cdn.rhy-portal.com" />
        
        {/* Preload critical battery image for AI Designer page */}
        <link rel="preload" href="/9Ah FlexVolt (4).png" as="image" fetchPriority="high" />
        
        {/* Security headers via meta tags */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' api.rhy-portal.com; frame-ancestors 'none';" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(self)" />
        
        {/* Performance and UX meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RHY Portal" />
        
        {/* Enterprise compliance and branding */}
        <meta name="application-name" content="RHY Supplier Portal" />
        <meta name="msapplication-TileColor" content="#006FEE" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased" suppressHydrationWarning>
        <noscript>
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">JavaScript Required</h1>
              <p className="text-gray-600 mb-4">
                RHY Supplier Portal requires JavaScript to function properly. 
                Please enable JavaScript in your browser to continue.
              </p>
              <p className="text-sm text-gray-500">
                For enterprise support, contact: support@rhy-portal.com
              </p>
            </div>
          </div>
        </noscript>
        
        <GoogleTagManager />
        <GoogleAnalytics />
        <MicrosoftClarity />
        <ClientLayout>
          <ToastProvider position="top-right" maxToasts={5}>
            <div className="relative min-h-screen">
              {children}
            </div>
          </ToastProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </ClientLayout>
        
        {/* Performance monitoring script placeholder */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring initialization
              if (typeof window !== 'undefined') {
                window.RHY_PERFORMANCE_START = Date.now();
              }
            `,
          }}
        />
      </body>
    </html>
  );
}