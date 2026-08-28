import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicSurvey, submitResponse } from "../../api/client";
import type { AnswerMap, AnswerValue, Question, Survey } from "../../types";

export default function SurveyForm() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicSurvey(id)
      .then(setSurvey)
      .catch(() => setLoadError("This survey is unavailable or not published."));
  }, [id]);

  const setAnswer = (qid: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
  };

  const toggleMulti = (qid: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [qid]: next };
    });
  };

  const validate = (questions: Question[]): boolean => {
    const found: Record<string, string> = {};
    for (const q of questions) {
      const value = answers[q.id];
      const empty =
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (q.required && empty) found[q.id] = "This question is required.";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    if (!validate(survey.questions)) return;

    setSubmitting(true);
    try {
      await submitResponse(survey.id, answers);
      setSubmitted(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Failed to submit. Please try again.";
      setLoadError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
        <p className="text-stone-600">{loadError}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Thank you!</h1>
          <p className="text-stone-500">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <p className="text-stone-500">Loading survey...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-10 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-4">
          <h1 className="text-2xl font-bold text-stone-900">{survey.title}</h1>
          {survey.description && <p className="text-stone-500 mt-2">{survey.description}</p>}
        </div>

        <div className="space-y-4">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl border border-stone-200 p-6">
              <label className="block font-medium text-stone-800 mb-3">
                {index + 1}. {q.label}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {q.type === "short_text" && (
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              )}

              {q.type === "long_text" && (
                <textarea
                  rows={4}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                />
              )}

              {q.type === "single_choice" && (
                <div className="space-y-2">
                  {q.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-stone-700">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        className="h-4 w-4 accent-teal-700"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "multiple_choice" && (
                <div className="space-y-2">
                  {q.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(answers[q.id]) &&
                          (answers[q.id] as string[]).includes(opt)
                        }
                        onChange={() => toggleMulti(q.id, opt)}
                        className="h-4 w-4 accent-teal-700"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "rating" && (
                <div className="flex gap-2">
                  {Array.from({ length: q.maxRating ?? 5 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n)}
                      className={`h-10 w-10 rounded-lg border text-sm font-medium ${
                        answers[q.id] === n
                          ? "bg-teal-700 text-white border-teal-700"
                          : "bg-white text-stone-600 border-stone-300 hover:border-teal-500"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {errors[q.id] && <p className="text-sm text-red-600 mt-2">{errors[q.id]}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit response"}
        </button>
      </form>
    </div>
  );
}
