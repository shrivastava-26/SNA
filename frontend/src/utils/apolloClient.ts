import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { enqueueSnackbar } from 'notistack';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
  credentials: 'include',
});

// Dedupe: track last shown error code+message to avoid toast spam
let lastToastKey = '';
let lastToastTime = 0;

function showToastOnce(message: string, variant: 'error' | 'warning', key: string) {
  const now = Date.now();
  if (key === lastToastKey && now - lastToastTime < 3000) return;
  lastToastKey = key;
  lastToastTime = now;
  enqueueSnackbar(message, { variant });
}

const errorLink = onError(({ graphQLErrors, networkError }) => {
  // ── Network-level errors (non-2xx HTTP responses) ──────────────────────
  if (networkError) {
    const status = 'statusCode' in networkError ? (networkError as { statusCode: number }).statusCode : 0;
    const onLoginPage = window.location.pathname === '/login';

    if (status === 429) {
      // On the login page, the form handles this inline via useLogin — no toast
      if (!onLoginPage) {
        showToastOnce(
          'Too many requests from your network. Please wait a moment before trying again.',
          'warning',
          'RATE_LIMITED'
        );
      }
      return;
    }

    if (status === 503 || status === 502 || status === 504) {
      showToastOnce('The server is temporarily unavailable. Please try again shortly.', 'error', 'SERVER_UNAVAILABLE');
      return;
    }

    // Generic network failure (offline, DNS, etc.)
    if (!status) {
      showToastOnce('Network error — please check your connection and try again.', 'error', 'NETWORK_ERROR');
      return;
    }
  }

  // ── GraphQL-level errors ───────────────────────────────────────────────
  if (!graphQLErrors?.length) return;

  for (const err of graphQLErrors) {
    const code = err.extensions?.code as string | undefined;

    if (code === 'RATE_LIMITED') {
      const onLoginPage = window.location.pathname === '/login';
      if (!onLoginPage) {
        showToastOnce(
          'Too many requests from your network. Please wait a moment before trying again.',
          'warning',
          'RATE_LIMITED'
        );
      }
      return;
    }

    if (code === 'UNAUTHENTICATED') {
      const onLoginPage = window.location.pathname === '/login';
      if (!onLoginPage) {
        apolloClient.clearStore().finally(() => {
          window.location.href = '/login';
        });
      }
      return;
    }

    if (code === 'FORBIDDEN') {
      showToastOnce("You don't have permission to perform this action.", 'error', 'FORBIDDEN');
      return;
    }

    if (code === 'INTERNAL_SERVER_ERROR') {
      console.error('[GraphQL INTERNAL_SERVER_ERROR]', err);
      showToastOnce('Something went wrong. Please try again.', 'error', 'INTERNAL_SERVER_ERROR');
      return;
    }

    // BAD_USER_INPUT is handled per-mutation in the component — no global toast here
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});
