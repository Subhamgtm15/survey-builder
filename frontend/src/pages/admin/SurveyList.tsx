import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Trash2, ExternalLink, LogOut } from "lucide-react";
import { deleteSurvey, listSurveys } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Surveys</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/surveys/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> New survey
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading && <p className="text-slate-500">Loading surveys...</p>}
        {isError && <p className="text-red-600">Failed to load surveys.</p>}

        {surveys && surveys.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 mb-4">No surveys yet.</p>
            <Link
              to="/admin/surveys/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Create your first survey
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {surveys?.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{survey.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      survey.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {survey.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
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
                    className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
                <Link
                  to={`/admin/surveys/${survey.id}/analytics`}
                  title="Analytics"
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <BarChart3 size={18} />
                </Link>
                <Link
                  to={`/admin/surveys/${survey.id}/edit`}
                  title="Edit"
                  className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <Pencil size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(survey)}
                  title="Delete"
                  className="p-2 rounded-md text-red-500 hover:bg-red-50"
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
