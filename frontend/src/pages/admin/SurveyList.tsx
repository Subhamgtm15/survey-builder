import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Trash2, ExternalLink, LogOut } from "lucide-react";
import { deleteSurvey, listSurveys } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import Logo from "../../components/Logo";
import type { Survey } from "../../types";

export default function SurveyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const { data: surveys, isLoading, isError } = useQuery({
    queryKey: ["surveys"],
    queryFn: listSurveys,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => deleteSurvey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["surveys"] }),
  });

  const handleDelete = (survey: Survey) => {
    if (window.confirm(`Delete "${survey.title}" and all its responses?`)) {
      removeMutation.mutate(survey.id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const publicUrl = (id: number) => `${window.location.origin}/s/${id}`;

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              to="/admin/surveys/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} /> New survey
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-stone-900 mb-6">Surveys</h1>
        {isLoading && <p className="text-stone-500">Loading surveys...</p>}
        {isError && <p className="text-red-600">Failed to load surveys.</p>}

        {surveys && surveys.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl">
            <p className="text-stone-500 mb-4">No surveys yet.</p>
            <Link
              to="/admin/surveys/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} /> Create your first survey
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {surveys?.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-stone-900">{survey.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      survey.is_published
                        ? "bg-teal-100 text-teal-800"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {survey.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-1">
                  {survey.questions.length} question(s) · {survey.response_count ?? 0} response(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {survey.is_published && (
                  <a
                    href={publicUrl(survey.id)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open public form"
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
                <Link
                  to={`/admin/surveys/${survey.id}/analytics`}
                  title="Analytics"
                  className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <BarChart3 size={18} />
                </Link>
                <Link
                  to={`/admin/surveys/${survey.id}/edit`}
                  title="Edit"
                  className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <Pencil size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(survey)}
                  title="Delete"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
