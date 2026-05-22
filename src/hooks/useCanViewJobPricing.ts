import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';

export function useCanViewJobPricing(): { canViewJobPricing: boolean; loading: boolean } {
  const { hasFeature, loading: featLoading } = useFeaturePermissions();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgAdminLoading } = useIsOrgAdmin();
  const loading = featLoading || adminLoading || orgAdminLoading;
  const canViewJobPricing = isAdmin || isOrgAdmin || hasFeature('view_job_pricing');
  return { canViewJobPricing, loading };
}
