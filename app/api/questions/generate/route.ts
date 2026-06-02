import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 503 });
  }

  try {
    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(`Genera exactamente 100 preguntas de trivia en español, variadas y entretenidas.
Devuelve SOLO un array JSON válido, sin markdown, sin texto adicional, sin bloques de código.

Estructura de cada objeto:
{
  "question": "Texto de la pregunta",
  "options": ["opción A", "opción B", "opción C", "opción D"],
  "correct_answer": "la opción correcta (debe coincidir exactamente con uno de los elementos de options)",
  "category": "una de: tecnologia, ciencia, historia, geografia, deportes, arte, naturaleza, matematicas",
  "difficulty": "una de: easy, medium, hard"
}

Reparte las preguntas entre todas las categorías (al menos 8 por categoría).
Empieza directamente con [ y termina con ].`);

    const text = result.response.text().trim();

    // Strip markdown code blocks if present
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'La IA no devolvió JSON válido', raw: text.slice(0, 300) },
        { status: 500 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawQuestions: any[] = JSON.parse(jsonMatch[0]);

    const valid = rawQuestions.filter(
      (q) =>
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct_answer === 'string' &&
        q.options.includes(q.correct_answer),
    );

    const rows = valid.map((q) => ({
      question:       q.question.trim(),
      options:        q.options.map((o: string) => String(o).trim()),
      correct_answer: q.correct_answer.trim(),
      category:       q.category   ?? 'general',
      difficulty:     q.difficulty ?? 'medium',
      source:         'ai',
      status:         'approved',
    }));

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(rows)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok:       true,
      inserted: data?.length ?? 0,
      parsed:   rawQuestions.length,
      valid:    valid.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
