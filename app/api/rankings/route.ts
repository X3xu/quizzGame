import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { containsBannedWord } from '@/lib/moderation';
import { rateLimit } from '@/lib/rate-limit';

// ─── Validation schema ────────────────────────────────────────────────────────

const SaveSchema = z.object({
  name:           z.string().min(1).max(20),
  avatar:         z.string().min(1).max(10),
  score:          z.number().int().min(0).max(30),
  totalQuestions: z.number().int().min(1).max(30),
  percentage:     z.number().int().min(0).max(100),
  streak:         z.number().int().min(0).max(30),
  duration:       z.number().int().min(0).max(3600),
  deviceId:       z.string().uuid().optional(),
  // Answers used for server-side consistency check
  answers: z.array(z.object({
    correct:   z.boolean(),
    timeSpent: z.number().min(0).max(15),
  })).min(1).max(30),
});

// ─── POST /api/rankings — save a game result ─────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo en un minuto.' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, avatar, score, totalQuestions, percentage, streak, duration, deviceId, answers } = parsed.data;

  // Server-side moderation — catches anyone bypassing the client check
  if (containsBannedWord(name)) {
    return NextResponse.json({ error: 'Nombre no permitido' }, { status: 422 });
  }

  // Consistency check: verify percentage matches the answers array
  const correct = answers.filter(a => a.correct).length;
  const expectedPct = Math.round((correct / answers.length) * 100);
  if (Math.abs(percentage - expectedPct) > 1) {
    return NextResponse.json({ error: 'Datos inconsistentes' }, { status: 422 });
  }

  // Score upper bound: with streak bonus max is answers.length * 2
  if (score > answers.length * 2) {
    return NextResponse.json({ error: 'Puntuación imposible' }, { status: 422 });
  }

  if (!supabaseAdmin) {
    // Supabase not configured — return a mock saved entry
    return NextResponse.json({ id: crypto.randomUUID(), date: new Date().toISOString() });
  }

  const { data, error } = await supabaseAdmin
    .from('rankings')
    .insert({
      name,
      avatar,
      score,
      total_questions: totalQuestions,
      percentage,
      streak,
      duration,
      device_id: deviceId ?? null,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('[rankings] insert error:', error.message);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, date: data.created_at }, { status: 201 });
}

// ─── GET /api/rankings — fetch leaderboard or rank position ──────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scoreParam = searchParams.get('position_for_score');

  if (scoreParam !== null) {
    const score = parseInt(scoreParam, 10);
    if (isNaN(score)) return NextResponse.json({ error: 'score inválido' }, { status: 400 });

    if (!supabaseAdmin) return NextResponse.json({ position: 1 });

    const { count } = await supabaseAdmin
      .from('rankings')
      .select('*', { count: 'exact', head: true })
      .gt('score', score);

    return NextResponse.json({ position: (count ?? 0) + 1 });
  }

  // Full leaderboard
  if (!supabaseAdmin) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin
    .from('rankings')
    .select('*')
    .order('score',    { ascending: false })
    .order('duration', { ascending: true  })
    .limit(50);

  if (error) {
    console.error('[rankings] fetch error:', error.message);
    return NextResponse.json({ error: 'Error al obtener el ranking' }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
