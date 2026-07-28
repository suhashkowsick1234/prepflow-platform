import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/lib/theme-provider';
import { WorkspaceProvider } from '@/lib/workspace-store';
import { AuthProvider } from '@/lib/auth-context';
import NotFound from '@/pages/not-found';
import { LandingPage } from '@/pages/landing-page';
import { WorkspacePage } from '@/pages/workspace-page';
import { ProfilePage } from '@/pages/profile-page';
import { Layout } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/workspace" component={WorkspacePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="prepflow-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkspaceProvider>
            <ErrorBoundary moduleName="Application">
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
            </ErrorBoundary>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
