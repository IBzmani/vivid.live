import type {Metadata} from 'next';
import { Spline_Sans } from 'next/font/google';
import './globals.css'; // Global styles

const splineSans = Spline_Sans({
  subsets: ['latin'],
  variable: '--font-spline-sans',
});

export const metadata: Metadata = {
  title: 'Vivid.live | Your Multimodal Showrunner Agent',
  description: 'Co-Create Your Cinematic Universe in Real-Time.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className={`${splineSans.variable} font-display bg-background-dark text-background-light selection:bg-primary selection:text-obsidian antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
