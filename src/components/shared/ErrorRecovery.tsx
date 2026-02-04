import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorRecoveryProps {
  error: Error | string;
  onRetry?: () => void;
  resetError?: () => void;
  title?: string;
  fullScreen?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  resetError,
  title = 'Something went wrong',
  fullScreen = false
}: ErrorRecoveryProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="bg-red-100 rounded-full p-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>

      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}

        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        If this problem persists, please contact support.
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg">
      {content}
    </div>
  );
}

interface AsyncWrapperProps<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | string | null;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyMessage?: string;
  children: (data: T) => React.ReactNode;
}

export function AsyncWrapper<T>({
  data,
  isLoading,
  error,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyMessage = 'No data available',
  children
}: AsyncWrapperProps<T>) {
  if (isLoading) {
    return loadingComponent || <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  if (error) {
    return errorComponent || <ErrorRecovery error={error} onRetry={onRetry} />;
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>{emptyMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return <>{children(data)}</>;
}
