import { GraphQLContext } from '../../types';
import { loginUser, getUserById } from '../../services/authService';
import { requireAuth } from './helpers';
import { parseOrThrow, loginSchema } from '../../validation';

const COOKIE_NAME = 'auth_token';
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

export const authResolvers = {
  Query: {
    me(_: unknown, __: unknown, context: GraphQLContext) {
      requireAuth(context);
      return getUserById(context.user!.userId);
    },
  },

  Mutation: {
    login(_: unknown, args: { email: string; password: string }, context: GraphQLContext) {
      const { email, password } = parseOrThrow(loginSchema, args);
      const { token, user } = loginUser(email, password);
      context.res.cookie(COOKIE_NAME, token, {
        ...COOKIE_BASE,
        secure: process.env.NODE_ENV === 'production',
      });
      return { user };
    },

    logout(_: unknown, __: unknown, context: GraphQLContext) {
      context.res.clearCookie(COOKIE_NAME, { path: '/' });
      return true;
    },
  },
};
