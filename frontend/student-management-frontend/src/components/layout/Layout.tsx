import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
interface LayoutProps {
  children: ReactNode;
  title: string;
}
export function Layout({ children, title }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>);

}