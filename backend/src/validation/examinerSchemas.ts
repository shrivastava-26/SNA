import { z } from 'zod';

const EXAMINER_ROLES = ['Principal Investigator', 'Sub-Investigator'] as const;

export const createExaminerSchema = z.object({
  examinerCode: z.string().min(1, 'Examiner code is required').max(50).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1, 'Name is required').max(200),
  specialty: z.string().min(1, 'Specialty is required').max(100),
  email: z.string().email('Must be a valid email'),
  role: z.enum(EXAMINER_ROLES, { error: 'Role must be Principal Investigator or Sub-Investigator' }),
  status: z.string().optional(),
});

export const updateExaminerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  specialty: z.string().min(1).max(100).optional(),
  email: z.string().email('Must be a valid email').optional(),
  role: z.enum(EXAMINER_ROLES, { error: 'Role must be Principal Investigator or Sub-Investigator' }).optional(),
  status: z.string().optional(),
});

export type CreateExaminerValidated = z.infer<typeof createExaminerSchema>;
export type UpdateExaminerValidated = z.infer<typeof updateExaminerSchema>;
