import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';

export function useCanViewAssemblyPricing(): { canViewAssemblyPricing: boolean; loading: boolean } {
  const { hasFeature, loading: featLoading } = useFeaturePermissions();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgAdminLoading } = useIsOrgAdmin();
  const loading = featLoading || adminLoading || orgAdminLoading;
  const canViewAssemblyPricing = isAdmin || isOrgAdmin || hasFeature('view_assembly_pricing');
  return { canViewAssemblyPricing, loading };
}
