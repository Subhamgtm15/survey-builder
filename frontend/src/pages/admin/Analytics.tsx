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
import Logo from "../../components/Logo";
import type { QuestionInsight } from "../../types";

const BAR_COLORS = ["#0d9488", "#f59e0b", "#e07a5f", "#2a9d8f", "#457b9d", "#e9c46a"];

function ChoiceChart({ insight }: { insight: QuestionInsight }) {
  const data = Object.entries(insight.counts ?? {}).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#78716c" }} />
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
      <p className="text-sm text-stone-500 mb-2">
        Average: <span className="font-semibold text-stone-800">{insight.average ?? 0}</span>
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#78716c" }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

function TextResponses({ insight }: { insight: QuestionInsight }) {
  if (!insight.responses || insight.responses.length === 0) {
    return <p className="text-sm text-stone-400">No responses yet.</p>;
  }
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {insight.responses.map((r, i) => (
        <li key={i} className="text-sm text-stone-700 bg-stone-50 rounded-lg px-3 py-2">
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
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo showText={false} />
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
          <h1 className="font-display font-semibold text-stone-900">{data?.survey.title ?? "Analytics"}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading && <p className="text-stone-500">Loading analytics...</p>}
        {isError && <p className="text-red-600">Failed to load analytics.</p>}

        {data && (
          <>
            <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
              <p className="text-sm text-stone-500">Total responses</p>
              <p className="text-4xl font-bold text-stone-900">{data.total}</p>
            </div>

            <div className="space-y-4">
              {data.insights.map((insight) => (
                <div key={insight.questionId} className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-medium text-stone-800">{insight.label}</h2>
                    <span className="text-xs text-stone-400">{insight.answered} answered</span>
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
