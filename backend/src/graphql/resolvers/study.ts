import { GraphQLError } from 'graphql';
import { GraphQLContext, StudyRow } from '../../types';
import {
  getStudiesPaged, getStudyById, getSitesByStudy, getExaminersByStudy,
  getStudySitesWithStudyExaminers,
  assignExaminerToStudySite, unassignExaminerFromStudySite,
  createStudy, updateStudy, assignSiteToStudy, unassignSiteFromStudy,
  CreateStudyInput, UpdateStudyInput,
} from '../../services/studyService';
import { requireAuth, requireAdmin, logAudit } from './helpers';
import {
  parseOrThrow, createStudySchema, updateStudySchema,
  assignmentSchema, idSchema, studySiteExaminerSchema, pickerPaginationSchema,
} from '../../validation';

export const studyResolvers = {
  Query: {
    getStudies(_: unknown, args: { page?: number; pageSize?: number }, context: GraphQLContext) {
      requireAuth(context);
      const { page, pageSize } = parseOrThrow(pickerPaginationSchema, { page: args.page ?? 1, pageSize: args.pageSize ?? 10 });
      return getStudiesPaged(page, pageSize);
    },
    getStudy(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      parseOrThrow(idSchema, id);
      return getStudyById(Number(id));
    },
  },

  Mutation: {
    createStudy(_: unknown, { input }: { input: CreateStudyInput }, context: GraphQLContext) {
      requireAdmin(context);
      const validated = parseOrThrow(createStudySchema, input);
      const study = createStudy(validated as CreateStudyInput);
      logAudit(context, 'CREATE', 'Study', study.id, null, JSON.stringify(study));
      return study;
    },

    updateStudy(_: unknown, { id, input }: { id: string; input: UpdateStudyInput }, context: GraphQLContext) {
      requireAdmin(context);
      parseOrThrow(idSchema, id);
      const validated = parseOrThrow(updateStudySchema, input);
      const before = getStudyById(Number(id));
      const study = updateStudy(Number(id), validated as UpdateStudyInput);
      logAudit(context, 'UPDATE', 'Study', study.id, JSON.stringify(before), JSON.stringify(study));
      return study;
    },

    assignSiteToStudy(_: unknown, { studyId, siteId }: { studyId: string; siteId: string }, context: GraphQLContext) {
      requireAdmin(context);
      parseOrThrow(assignmentSchema, { studyId, siteId });
      assignSiteToStudy(Number(studyId), Number(siteId));
      return true;
    },

    unassignSiteFromStudy(_: unknown, { studyId, siteId }: { studyId: string; siteId: string }, context: GraphQLContext) {
      requireAdmin(context);
      parseOrThrow(assignmentSchema, { studyId, siteId });
      unassignSiteFromStudy(Number(studyId), Number(siteId));
      return true;
    },

    // Assignment mutations are not logged via logAudit because they are junction-table
    // operations (not CREATE/UPDATE of entity rows). Consistent with existing
    // assignSiteToStudy / assignExaminerToSite which also skip audit logging.
    assignExaminerToStudySite(
      _: unknown,
      { studyId, siteId, examinerId }: { studyId: string; siteId: string; examinerId: string },
      context: GraphQLContext
    ) {
      requireAdmin(context);
      parseOrThrow(studySiteExaminerSchema, { studyId, siteId, examinerId });
      assignExaminerToStudySite(Number(studyId), Number(siteId), Number(examinerId));
      return true;
    },

    unassignExaminerFromStudySite(
      _: unknown,
      { studyId, siteId, examinerId }: { studyId: string; siteId: string; examinerId: string },
      context: GraphQLContext
    ) {
      requireAdmin(context);
      parseOrThrow(studySiteExaminerSchema, { studyId, siteId, examinerId });
      unassignExaminerFromStudySite(Number(studyId), Number(siteId), Number(examinerId));
      return true;
    },
  },

  Study: {
    sites(parent: StudyRow) { return getSitesByStudy(parent.id); },
    examiners(parent: StudyRow) { return getExaminersByStudy(parent.id); },
    studySites(parent: StudyRow) { return getStudySitesWithStudyExaminers(parent.id); },
  },
};
