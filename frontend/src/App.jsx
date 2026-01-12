import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Layout from './components/Layout/Layout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Users from './pages/Admin/Users';
import Stats from './pages/Admin/Stats';
import Team from './pages/Admin/Team';
import Clients from './pages/CRM/Clients';
import Projects from './pages/Projects/Projects';
import KanbanBoard from './pages/Projects/KanbanBoard';
import Tasks from './pages/Projects/Tasks';
import CalendarPage from './pages/Dashboard/Calendar';

// --- LE COMPOSANT MANQUANT EST ICI ---
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Affiche un écran de chargement pendant que l'on vérifie le token
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement de NexusCRM...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, on affiche le Layout + le contenu
  // Sinon, on redirige vers la page de Login
  return user ? (
    <Layout>
      {children}
    </Layout>
  ) : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page publique */}
          <Route path="/login" element={<Login />} />

          {/* Toutes ces routes utilisent PrivateRoute pour la sécurité */}
          <Route path="/" element={<PrivateRoute><DashboardHome /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
          <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><KanbanBoard /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />

          {/* Redirection automatique si la route n'existe pas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;