import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePagePermissions, ALL_PAGES } from '@/hooks/usePagePermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isUrlAllowed, allowedPages, loading: permissionsLoading } = usePagePermissions();
  const location = useLocation();

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isUrlAllowed(location.pathname)) {
    // Find the first allowed page to redirect to (avoid infinite loop on /)
    const firstAllowed = ALL_PAGES.find(p => allowedPages.has(p.key) && p.url !== location.pathname);
    if (firstAllowed) {
      return <Navigate to={firstAllowed.url} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
