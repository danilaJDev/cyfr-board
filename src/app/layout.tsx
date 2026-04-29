import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CYFR Board',
  description: 'Управление проектами, разрешениями и задачами CYFR FITOUT L.L.C',
  icons: {
    icon: '/cyfr-logo-gold.svg',
  },
}

// Inline script injected BEFORE React hydration to prevent flash of wrong theme.
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('theme');
    if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
    document.documentElement.setAttribute('data-theme',t);
  }catch(e){}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
