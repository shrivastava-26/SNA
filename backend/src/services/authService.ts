import { GraphQLError } from 'graphql';
import { verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { findUserByEmail, findUserById } from '../repositories/authRepository';

export function loginUser(email: string, password: string) {
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.password)) {
    throw new GraphQLError('Invalid credentials', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export function getUserById(id: number) {
  return findUserById(id);
}
