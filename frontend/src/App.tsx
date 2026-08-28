import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/admin/Login";
import SurveyList from "./pages/admin/SurveyList";
import SurveyBuilder from "./pages/admin/SurveyBuilder";
import Analytics from "./pages/admin/Analytics";
import SurveyForm from "./pages/public/SurveyForm";
import type { JSX } from "react";

// Gates admin routes behind a valid token; otherwise redirects to login.
function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public survey form */}
      <Route path="/s/:id" element={<SurveyForm />} />

      {/* Admin */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <SurveyList />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/surveys/new"
        element={
          <RequireAuth>
            <SurveyBuilder />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/surveys/:id/edit"
        element={
          <RequireAuth>
            <SurveyBuilder />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/surveys/:id/analytics"
        element={
          <RequireAuth>
            <Analytics />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
