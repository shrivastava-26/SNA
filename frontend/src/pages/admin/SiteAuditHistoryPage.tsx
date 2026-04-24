import { useParams } from 'react-router-dom';
import { useSite } from '../../hooks/useSite';
import { EntityAuditHistoryPage } from '../admin/EntityAuditHistoryPage';

export function SiteAuditHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { site } = useSite(id);
  return (
    <EntityAuditHistoryPage
      entityType="Site"
      backTo={`/admin/sites/${id}`}
      backLabel="Site Details"
      entityLabel={site?.siteCode}
    />
  );
}
