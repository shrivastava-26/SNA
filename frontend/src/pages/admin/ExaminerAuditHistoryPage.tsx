import { useParams } from 'react-router-dom';
import { useExaminer } from '../../hooks/useExaminer';
import { EntityAuditHistoryPage } from '../admin/EntityAuditHistoryPage';

export function ExaminerAuditHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { examiner } = useExaminer(id);
  return (
    <EntityAuditHistoryPage
      entityType="Examiner"
      backTo={`/admin/examiners/${id}`}
      backLabel="Examiner Details"
      entityLabel={examiner?.examinerCode}
    />
  );
}
