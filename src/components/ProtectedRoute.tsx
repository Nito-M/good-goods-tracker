import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isUrlAllowed, loading: permissionsLoading } = usePagePermissions();
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
