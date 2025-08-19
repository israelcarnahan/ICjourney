import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Beer } from "lucide-react";
import Navbar from "./components/Navbar";
import { PubDataProvider, usePubData } from "./context/PubDataContext";
import { AuthProvider } from "./context/AuthContext";
import { LoginGate } from "./context/LoginGate";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load route components
const Home = React.lazy(() => import("./pages/Home"));
const About = React.lazy(() => import("./pages/About"));
const PlannerDashboard = React.lazy(() => import("./pages/PlannerDashboard"));

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-eggplant-900 flex items-center justify-center">
    <div className="animate-pulse text-eggplant-100">Loading...</div>
  </div>
);

const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({
  element,
}) => {
  const { isInitialized } = usePubData();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <>{element}</>;
};

const AppContent: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    });
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleThrottledMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleThrottledMouseMove, {
      passive: true,
    });
    return () => {
      window.removeEventListener("mousemove", handleThrottledMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 relative">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/planner"
                element={<ProtectedRoute element={<PlannerDashboard />} />}
              />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 text-dark-100 py-8 border-t border-eggplant-800 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Beer className="h-10 w-10 mr-3 text-neon-blue animate-pulse" />
                <span className="text-3xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                  Israel's Journey Planner
                </span>
              </div>
              <div className="text-sm">
                <p className="text-eggplant-100">
                  &copy; {new Date().getFullYear()} Israel S.G.N.R. Carnahan |
                  Created for Field Sales Representatives
                </p>
                <p className="text-eggplant-300 text-xs mt-1">
                  Original algorithm and business logic by Israel Carnahan
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LoginGate>
          <PubDataProvider>
            <AppContent />
          </PubDataProvider>
        </LoginGate>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

// Intentional type error for testing pre-push hook
const testError: string = 123;
