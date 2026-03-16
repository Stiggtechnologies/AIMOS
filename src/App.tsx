import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import { EnterpriseShell, ModuleRouter } from './components/layout';
import PatientExperienceDashboard from './components/patient-experience/PatientExperienceDashboard';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AIM OS...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  if (profile.role === 'patient') {
    return <PatientExperienceDashboard />;
  }

  return (
    <EnterpriseShell>
      {({ currentModule, currentSubModule, onNavigate }) => (
        <ModuleRouter
          currentModule={currentModule}
          currentSubModule={currentSubModule}
          onNavigate={onNavigate}
        />
      )}
    </EnterpriseShell>
  );
}

export default App;
