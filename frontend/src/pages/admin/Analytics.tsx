import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics } from "../../api/client";
import type { QuestionInsight } from "../../types";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function ChoiceChart({ insight }: { insight: QuestionInsight }) {
  const data = Object.entries(insight.counts ?? {}).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RatingChart({ insight }: { insight: QuestionInsight }) {
  const data = Object.entries(insight.distribution ?? {}).map(([name, value]) => ({
    name: `${name}★`,
    value,
  }));
  return (
    <>
      <p className="text-sm text-slate-500 mb-2">
        Average: <span className="font-semibold text-slate-800">{insight.average ?? 0}</span>
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

function TextResponses({ insight }: { insight: QuestionInsight }) {
  if (!insight.responses || insight.responses.length === 0) {
    return <p className="text-sm text-slate-400">No responses yet.</p>;
  }
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {insight.responses.map((r, i) => (
        <li key={i} className="text-sm text-slate-700 bg-slate-50 rounded-md px-3 py-2">
          {r}
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => getAnalytics(id!),
    enabled: Boolean(id),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="font-semibold text-slate-900">{data?.survey.title ?? "Analytics"}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading && <p className="text-slate-500">Loading analytics...</p>}
        {isError && <p className="text-red-600">Failed to load analytics.</p>}

        {data && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <p className="text-sm text-slate-500">Total responses</p>
              <p className="text-4xl font-bold text-slate-900">{data.total}</p>
            </div>

            <div className="space-y-4">
              {data.insights.map((insight) => (
                <div key={insight.questionId} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-medium text-slate-800">{insight.label}</h2>
                    <span className="text-xs text-slate-400">{insight.answered} answered</span>
                  </div>

                  {(insight.type === "single_choice" || insight.type === "multiple_choice") && (
                    <ChoiceChart insight={insight} />
                  )}
                  {insight.type === "rating" && <RatingChart insight={insight} />}
                  {(insight.type === "short_text" || insight.type === "long_text") && (
                    <TextResponses insight={insight} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
