import { GraphQLContext, ExaminerRow } from '../../types';
import {
  getExaminersPaged, getExaminerById, getStudiesByExaminer, getSitesByExaminer,
  createExaminer, updateExaminer, CreateExaminerInput, UpdateExaminerInput,
} from '../../services/examinerService';
import { requireAuth, requireAdmin, logAudit } from './helpers';
import {
  parseOrThrow, createExaminerSchema, updateExaminerSchema, idSchema, pickerPaginationSchema,
} from '../../validation';

export const examinerResolvers = {
  Query: {
    getExaminers(_: unknown, args: { page?: number; pageSize?: number }, context: GraphQLContext) {
      requireAuth(context);
      const { page, pageSize } = parseOrThrow(pickerPaginationSchema, { page: args.page ?? 1, pageSize: args.pageSize ?? 10 });
      return getExaminersPaged(page, pageSize);
    },
    getExaminer(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      parseOrThrow(idSchema, id);
      return getExaminerById(Number(id));
    },
  },

  Mutation: {
    createExaminer(_: unknown, { input }: { input: CreateExaminerInput }, context: GraphQLContext) {
      requireAdmin(context);
      const validated = parseOrThrow(createExaminerSchema, input);
      const examiner = createExaminer(validated as CreateExaminerInput);
      logAudit(context, 'CREATE', 'Examiner', examiner.id, null, JSON.stringify(examiner));
      return examiner;
    },

    updateExaminer(_: unknown, { id, input }: { id: string; input: UpdateExaminerInput }, context: GraphQLContext) {
      requireAdmin(context);
      parseOrThrow(idSchema, id);
      const validated = parseOrThrow(updateExaminerSchema, input);
      const before = getExaminerById(Number(id));
      const examiner = updateExaminer(Number(id), validated as UpdateExaminerInput);
      logAudit(context, 'UPDATE', 'Examiner', examiner.id, JSON.stringify(before), JSON.stringify(examiner));
      return examiner;
    },
  },

  Examiner: {
    studies(parent: ExaminerRow) { return getStudiesByExaminer(parent.id); },
    sites(parent: ExaminerRow) { return getSitesByExaminer(parent.id); },
  },
};
