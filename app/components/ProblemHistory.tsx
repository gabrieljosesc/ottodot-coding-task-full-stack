"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Session {
  id: string;
  problem_text: string;
  difficulty?: string;
  problem_type?: string;
  created_at: string;
}

export default function ProblemHistory() {
  const [history, setHistory] = useState<Session[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("math_problem_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setHistory(data);
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Recent Problems
      </h2>
      <ul className="grid gap-4">
        {history.map((session) => (
          <li
            key={session.id}
            className="bg-white p-4 rounded-lg shadow border"
          >
            <p className="text-gray-800 mb-2">{session.problem_text}</p>
            <p className="text-sm text-gray-500 italic">
              Difficulty: {session.difficulty ?? "unknown"} | Type:{" "}
              {session.problem_type ?? "unspecified"}
              <br />
              Created: {new Date(session.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
