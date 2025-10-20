import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Generate a Primary 5 level math word problem based on the Singapore syllabus.
Return a clean JSON object ONLY, no extra text.
Include:
- problem_text
- final_answer
- difficulty ("easy", "medium", "hard")
- problem_type (e.g., "fractions", "geometry", "multiplication")

Example:
{
  "problem_text": "Mrs Tan baked some cookies...",
  "final_answer": 72,
  "difficulty": "medium",
  "problem_type": "fractions"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Invalid Gemini response: ${text}`);

    const problem = JSON.parse(jsonMatch[0]);

    if (
      !problem.problem_text ||
      typeof problem.final_answer !== "number" ||
      !["easy", "medium", "hard"].includes(problem.difficulty) ||
      typeof problem.problem_type !== "string"
    ) {
      throw new Error("Invalid JSON structure from AI");
    }

    const { data: session, error } = await supabase
      .from("math_problem_sessions")
      .insert({
        problem_text: problem.problem_text,
        correct_answer: problem.final_answer,
        difficulty: problem.difficulty,
        problem_type: problem.problem_type,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session });
  } catch (err: any) {
    console.error("🔥 FULL ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error", stack: err.stack },
      { status: 500 }
    );
  }
}
