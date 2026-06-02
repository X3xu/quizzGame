import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase';

interface SubmitBody {
  question:       string;
  options:        string[];
  correct_answer: string;
  category:       string;
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 503 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { question, options, correct_answer, category } = body;

  if (
    !question?.trim() ||
    !Array.isArray(options) ||
    options.length !== 4 ||
    options.some((o) => !o?.trim()) ||
    !correct_answer?.trim()
  ) {
    return NextResponse.json({ error: 'Formato de pregunta inválido' }, { status: 400 });
  }

  if (!options.includes(correct_answer)) {
    return NextResponse.json(
      { error: 'correct_answer debe ser uno de los elementos de options' },
      { status: 400 },
    );
  }

  try {
    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const reviewResult = await model.generateContent(
      `Revisa esta pregunta de trivia. Devuelve SOLO JSON válido, sin markdown.

Pregunta: ${question}
Opciones: ${options.join(' | ')}
Respuesta correcta: ${correct_answer}

Criterios de rechazo: pregunta ofensiva, datos incorrectos, ambigüedad grave.

Devuelve exactamente: {"approved": true/false, "note": "OK o motivo de rechazo (max 100 chars)", "difficulty": "easy|medium|hard"}`
    );

    const reviewText = reviewResult.response.text().trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
    const review    = jsonMatch ? JSON.parse(jsonMatch[0]) : { approved: false, note: 'Error al revisar' };

    const status: 'approved' | 'rejected' = review.approved ? 'approved' : 'rejected';

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        question:       question.trim(),
        options:        options.map((o) => o.trim()),
        correct_answer: correct_answer.trim(),
        category:       category ?? 'general',
        difficulty:     review.difficulty ?? 'medium',
        source:         'user',
        status,
        review_note:    review.note ?? '',
      })
      .select('id, status, review_note')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id:       data.id,
      approved: status === 'approved',
      status,
      note:     data.review_note,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
