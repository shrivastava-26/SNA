import { GraphQLContext } from '../../types';
import { getAuditLogs } from '../../services/auditService';
import { requireAdmin } from './helpers';

export const auditResolvers = {
  Query: {
    getAuditLogs(
      _: unknown,
      {
        entityType,
        entityId,
        page = 1,
        pageSize = 25,
      }: { entityType?: string; entityId?: number; page?: number; pageSize?: number },
      context: GraphQLContext
    ) {
      requireAdmin(context);
      return getAuditLogs(entityType, entityId, page, pageSize);
    },
  },
};
