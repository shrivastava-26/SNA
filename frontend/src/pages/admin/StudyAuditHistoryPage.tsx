import { useParams } from 'react-router-dom';
import { useStudy } from '../../hooks/useStudy';
import { EntityAuditHistoryPage } from '../admin/EntityAuditHistoryPage';

export function StudyAuditHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { study } = useStudy(id);
  return (
    <EntityAuditHistoryPage
      entityType="Study"
      backTo={`/admin/studies/${id}`}
      backLabel="Study Details"
      entityLabel={study?.protocolId}
    />
  );
}
