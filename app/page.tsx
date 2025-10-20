"use client";

import { useState } from "react";
import ProblemHistory from "./components/ProblemHistory";

interface MathProblem {
  problem_text: string;
  final_answer: number;
  difficulty?: string;
  problem_type?: string;
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const generateProblem = async () => {
    // TODO: Implement problem generation logic
    // This should call your API route to generate a new problem
    // and save it to the database

    try {
      setIsLoading(true);
      const res = await fetch("/api/generate-problem", { method: "POST" });
      const data = await res.json();
      setProblem({
        problem_text: data.session.problem_text,
        final_answer: data.session.correct_answer,
        difficulty: data.session.difficulty,
        problem_type: data.session.problem_type,
      });
      setSessionId(data.session.id);
      setUserAnswer("");
      setFeedback("");
      setIsCorrect(null);
    } catch (err) {
      alert("Failed to generate problem");
    } finally {
      setIsLoading(false);
    }
  };

  // const submitAnswer = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // TODO: Implement answer submission logic
  //   // This should call your API route to check the answer,
  //   // save the submission, and generate feedback

  //   if (!sessionId) return;
  //   try {
  //     setIsLoading(true);
  //     const res = await fetch("/api/submit-answer", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         session_id: sessionId,
  //         user_answer: Number(userAnswer),
  //       }),
  //     });
  //     const data = await res.json();
  //     setFeedback(data.submission.feedback_text);
  //     setHint(data.submission.hint || "");
  //     setIsCorrect(data.submission.is_correct);
  //   } catch (err) {
  //     alert("Failed to submit answer");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement answer submission logic
    // This should call your API route to check the answer,
    // save the submission, and generate feedback
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: Number(userAnswer),
        }),
      });
      const data = await res.json();
      setFeedback(data.submission.feedback_text);
      setHint(data.submission.hint || "");
      setIsCorrect(data.submission.is_correct);
    } catch (err) {
      alert("Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Math Problem Generator
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            {isLoading ? "Generating..." : "🎲 Generate New Problem"}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Problem:
            </h2>
            <p className="text-lg text-gray-800 leading-relaxed mb-6">
              {problem.problem_text}
            </p>

            <p className="text-sm text-gray-500 italic mb-6">
              Difficulty: {problem.difficulty ?? "unknown"} | Type:{" "}
              {problem.problem_type ?? "unspecified"}
            </p>

            <form onSubmit={submitAnswer} className="space-y-6">
              <div className="mb-6">
                <label
                  htmlFor="answer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
              >
                Submit Answer
              </button>
            </form>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl shadow-lg p-6 mt-6 ${
              isCorrect
                ? "bg-green-50 border-l-4 border-green-400"
                : "bg-yellow-50 border-l-4 border-yellow-400"
            }`}
          >
            <h2 className="text-xl font-bold mb-2">
              {isCorrect ? "✅ Correct!" : "❌ Not quite right"}
            </h2>
            <p className="text-gray-700 text-base mb-4">{feedback}</p>

            {/* Show hint when answer is incorrect */}
            {!isCorrect && hint && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Hint:</strong> {hint}
                </p>
              </div>
            )}

            <button
              onClick={generateProblem}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 mt-4"
            >
              🔁 Try Another Problem
            </button>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            🕘 Recent Problems
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-indigo-600 underline text-sm mb-4"
          >
            {showHistory ? "Hide" : "Show"} Recent Problems
          </button>

          {showHistory && <ProblemHistory />}
        </div>
      </main>
    </div>
  );
}
