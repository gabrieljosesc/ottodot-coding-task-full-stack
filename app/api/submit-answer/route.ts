import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { session_id, user_answer } = await req.json();

    const { data: session } = await supabase
      .from("math_problem_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) throw new Error("Session not found");

    const is_correct = Number(user_answer) === Number(session.correct_answer);

    // Generate feedback
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const feedbackPrompt = `
      Student answered a math problem.
      Problem: ${session.problem_text}
      Correct Answer: ${session.correct_answer}
      Student's Answer: ${user_answer}

      Give short, friendly feedback in 2-3 sentences.
      If correct, congratulate them.
      If incorrect, gently explain the right reasoning (no full solution steps).
      Also include a hint or partial step-by-step explanation if possible.
      Return as valid JSON ONLY:
      {
        "feedback_text": "...",
        "hint": "..."
      }
      `;

    const result = await model.generateContent(feedbackPrompt);
    const feedbackText = result.response.text().trim();

    // Parse the JSON feedback
    const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      throw new Error(`Invalid feedback response: ${feedbackText}`);

    const feedback = JSON.parse(jsonMatch[0]);

    if (!feedback.feedback_text || !feedback.hint) {
      throw new Error("Invalid feedback structure from AI");
    }

    // Save submission to Supabase
    const { data: submission, error } = await supabase
      .from("math_problem_submissions")
      .insert({
        session_id,
        user_answer,
        is_correct,
        feedback_text: feedback.feedback_text,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      submission: {
        ...submission,
        feedback_text: feedback.feedback_text,
        hint: feedback.hint,
      },
    });
  } catch (error: any) {
    console.error("Error submitting answer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
