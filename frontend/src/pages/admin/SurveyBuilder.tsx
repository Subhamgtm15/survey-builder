import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { createSurvey, getSurvey, updateSurvey } from "../../api/client";
import Logo from "../../components/Logo";
import { QUESTION_TYPE_LABELS } from "../../types";
import type { Question, QuestionType } from "../../types";

const newQuestion = (type: QuestionType): Question => ({
  id: crypto.randomUUID(),
  type,
  label: "",
  required: false,
  ...(type === "single_choice" || type === "multiple_choice"
    ? { options: ["Option 1", "Option 2"] }
    : {}),
  ...(type === "rating" ? { maxRating: 5 } : {}),
});

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export default function SurveyBuilder() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    getSurvey(id)
      .then((survey) => {
        setTitle(survey.title);
        setDescription(survey.description ?? "");
        setQuestions(survey.questions);
        setIsPublished(survey.is_published);
      })
      .catch(() => setError("Failed to load survey."))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQuestion = (qid: string, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (qid: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateOption = (qid: string, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qid || !q.options) return q;
        const options = [...q.options];
        options[optIndex] = value;
        return { ...q, options };
      })
    );
  };

  const addOption = (qid: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid && q.options
          ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
          : q
      )
    );
  };

  const removeOption = (qid: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid && q.options
          ? { ...q, options: q.options.filter((_, i) => i !== optIndex) }
          : q
      )
    );
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim()) return setError("Survey title is required.");
    if (questions.length === 0) return setError("Add at least one question.");
    for (const q of questions) {
      if (!q.label.trim()) return setError("Every question needs a label.");
      if (CHOICE_TYPES.includes(q.type) && (q.options?.filter((o) => o.trim()).length ?? 0) < 2) {
        return setError(`"${q.label || "A choice question"}" needs at least two options.`);
      }
    }

    const payload = { title: title.trim(), description: description.trim(), questions, isPublished };
    setSaving(true);
    try {
      if (isEditing) await updateSurvey(id!, payload);
      else await createSurvey(payload);
      navigate("/admin");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Failed to save survey.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-stone-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo showText={false} />
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-teal-700"
              />
              Published
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save survey"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title"
            className="w-full text-2xl font-bold text-stone-900 placeholder:text-stone-300 focus:outline-none mb-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full text-sm text-stone-600 placeholder:text-stone-300 focus:outline-none resize-none"
          />
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex flex-col pt-2">
                  <button
                    onClick={() => moveQuestion(index, -1)}
                    className="text-stone-300 hover:text-stone-600"
                    title="Move up"
                  >
                    <GripVertical size={16} />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex gap-3 mb-3">
                    <input
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      placeholder={`Question ${index + 1}`}
                      className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value as QuestionType;
                        const replacement = newQuestion(type);
                        updateQuestion(q.id, {
                          type,
                          options: replacement.options,
                          maxRating: replacement.maxRating,
                        });
                      }}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {CHOICE_TYPES.includes(q.type) && (
                    <div className="space-y-2 mb-3 pl-1">
                      {q.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <span className="text-stone-400 text-sm">{optIndex + 1}.</span>
                          <input
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                            className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          {(q.options?.length ?? 0) > 2 && (
                            <button
                              onClick={() => removeOption(q.id, optIndex)}
                              className="text-stone-300 hover:text-red-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(q.id)}
                        className="text-sm text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> Add option
                      </button>
                    </div>
                  )}

                  {q.type === "rating" && (
                    <div className="mb-3">
                      <label className="text-sm text-stone-600 mr-2">Max rating:</label>
                      <select
                        value={q.maxRating ?? 5}
                        onChange={(e) => updateQuestion(q.id, { maxRating: Number(e.target.value) })}
                        className="rounded-lg border border-stone-300 px-2 py-1 text-sm bg-white"
                      >
                        {[3, 4, 5, 7, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                        className="h-4 w-4 accent-teal-700"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="text-sm text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setQuestions((prev) => [...prev, newQuestion(type)])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Plus size={15} /> {QUESTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
