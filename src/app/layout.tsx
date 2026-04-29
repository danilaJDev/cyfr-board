import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {Analytics} from '@vercel/analytics/next'
import {SpeedInsights} from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'CYFR Board',
    description: 'Управление проектами, разрешениями и задачами CYFR FITOUT L.L.C',
    icons: {
        icon: '/cyfr-logo-gold.svg',
    },
}

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
        <html lang="ru" suppressHydrationWarning className={inter.variable}>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <head>
            <script dangerouslySetInnerHTML={{__html: themeScript}}/>
        </head>
        <body suppressHydrationWarning>
        {children}
        <Analytics/>
        <SpeedInsights/>
        </body>
        </html>
    )
}
