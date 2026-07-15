import './globals.css';

export const metadata = {
  title: 'PointMaster',
  description: 'Web app for managing offline card game scores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
