import { useMutation, useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { LOGIN_MUTATION, ME_QUERY } from '../services/authService';
import { parseGqlError } from '../utils/gqlErrors';

export function useLogin() {
  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);
  const client = useApolloClient();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  async function submitLogin(email: string, password: string): Promise<string | null> {
    try {
      const { data } = await loginMutation({ variables: { email, password } });
      await client.refetchQueries({ include: [ME_QUERY] });
      const role = data?.login?.user?.role;
      enqueueSnackbar('Signed in successfully.', { variant: 'success' });
      navigate(role === 'ADMIN' ? '/admin/dashboard' : '/viewer/dashboard');
      return null;
    } catch (err: unknown) {
      const { message } = parseGqlError(err);
      return message;
    }
  }

  return { submitLogin, loading };
}
