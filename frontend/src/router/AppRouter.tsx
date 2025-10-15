/**
 * Route-based code splitting configuration
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spinner } from '../components/UI/UIComponents';
import { preloadComponent } from '../utils/performance';

// Lazy load route components
const HomePage = lazy(() => import('../pages/HomePage'));
const EndorsementPage = lazy(() => import('../pages/EndorsementPage'));
const DocumentsPage = lazy(() => import('../pages/DocumentsPage'));
const LettersPage = lazy(() => import('../pages/LettersPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Preload critical routes
if (typeof window !== 'undefined') {
  // Preload homepage and endorsement page on app start
  setTimeout(() => {
    preloadComponent(() => import('../pages/HomePage'));
    preloadComponent(() => import('../pages/EndorsementPage'));
  }, 1000);
}

// Route configuration with preloading
const routes = [
  {
    path: '/',
    component: HomePage,
    preloadOn: 'hover',
  },
  {
    path: '/endorsement',
    component: EndorsementPage,
    preloadOn: 'hover',
  },
  {
    path: '/documents',
    component: DocumentsPage,
    preloadOn: 'immediate',
  },
  {
    path: '/letters',
    component: LettersPage,
    preloadOn: 'hover',
  },
  {
    path: '/settings',
    component: SettingsPage,
    preloadOn: 'never',
  },
];

// Loading fallback component
const RouteLoader: React.FC = () => (
  <div className="route-loader">
    <Spinner size="lg" />
    <p>Loading page...</p>
  </div>
);

// Error fallback for route loading errors
const RouteError: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="route-error">
    <h2>Failed to load page</h2>
    <p>{error.message}</p>
    <button onClick={retry} className="btn btn-primary">
      Try Again
    </button>
  </div>
);

// Route wrapper with error boundary
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return <RouteError error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Main router with code splitting
export const AppRouter: React.FC = () => (
  <RouteErrorBoundary>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/endorsement" element={<EndorsementPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  </RouteErrorBoundary>
);

// Hook for route preloading
export function useRoutePreloader() {
  const preloadRoute = React.useCallback((routePath: string) => {
    const route = routes.find(r => r.path === routePath);
    if (route) {
      preloadComponent(() => import(`../pages/${route.component.name}`));
    }
  }, []);

  return { preloadRoute };
}

// Navigation link with preloading
interface PreloadLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  preloadDelay?: number;
}

export const PreloadLink: React.FC<PreloadLinkProps> = ({ 
  to, 
  children, 
  className = '',
  preloadDelay = 200 
}) => {
  const { preloadRoute } = useRoutePreloader();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      preloadRoute(to);
    }, preloadDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <a
      href={to}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
};