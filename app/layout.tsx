import type { Metadata, Viewport } from 'next';
import './globals.css';
import './enhancements.css';
export const metadata: Metadata = { title: 'SingShot | The London Karaoke Club', description: 'Capture the moment. Join the big screen.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#10091c' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
