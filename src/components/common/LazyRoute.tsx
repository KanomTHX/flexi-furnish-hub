import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface LazyRouteProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: ComponentType<{ error: Error }>;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ 
  factory, 
  fallback,
  errorFallback 
}) => {
  const LazyComponent = lazy(factory);
  
  return (
    <ErrorBoundary fallback={errorFallback ? (props: any) => React.createElement(errorFallback, props) : undefined}>
      <Suspense fallback={fallback || <LoadingSpinner size="lg" />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

// HOC for creating lazy routes with consistent error handling
export const createLazyRoute = (
  factory: () => Promise<{ default: ComponentType<any> }>,
  loadingText?: string
) => {
  return () => (
    <LazyRoute 
      factory={factory}
      fallback={<LoadingSpinner text={loadingText} size="lg" />}
    />
  );
};