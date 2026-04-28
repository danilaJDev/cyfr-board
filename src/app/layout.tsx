import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CYFR Board',
  description: 'Управление проектами, разрешениями и задачами CYFR FITOUT L.L.C',
}

const themeScript = `
(() => {
  const storageKey = 'cyfr-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(storageKey);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'light' || saved === 'dark' ? saved : (systemDark ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
