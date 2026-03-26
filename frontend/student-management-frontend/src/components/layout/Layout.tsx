import { ReactNode, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <div
      data-role={currentUser?.role}
      className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] px-3 py-3 text-[var(--text-strong)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 ui-layout-accent-glow" />
      </div>

      <div className="relative flex h-[calc(100vh-1.5rem)] gap-3 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="ui-panel-surface ui-panel-surface-strong flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px]">
          <Header title={title} onMobileMenuOpen={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1720px] p-4 lg:p-6 2xl:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
