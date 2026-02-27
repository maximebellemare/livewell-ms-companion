import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ExerciseDbItem = {
  id?: string | number;
  name?: string;
  gifUrl?: string;
  gifurl?: string;
  gifURL?: string;
  equipment?: string;
  bodyPart?: string;
  target?: string;
};

const STOP_WORDS = new Set(["the", "a", "an", "with", "and", "or", "for", "to", "on", "in", "at", "of"]);

const EQUIPMENT_KEYWORDS = [
  "dumbbell", "barbell", "kettlebell", "cable", "machine", "band",
  "resistance", "bodyweight", "body weight", "trx", "smith",
];

const MOVEMENT_KEYWORDS = [
  "curl", "press", "squat", "lunge", "deadlift", "row", "raise",
  "extension", "fly", "plank", "crunch", "pulldown", "kickback",
  "bridge", "push", "pull", "stretch", "twist", "rotation",
  "step", "walk", "march", "hold", "lift",
];

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const tokenize = (value: string) =>
  normalize(value).split(" ").filter((t) => t.length > 1 && !STOP_WORDS.has(t));

const extractEquipment = (value: string) => {
  const n = normalize(value);
  return EQUIPMENT_KEYWORDS.find((k) => n.includes(k)) || null;
};

const extractMovement = (value: string) => {
  const n = normalize(value);
  return MOVEMENT_KEYWORDS.find((k) => n.includes(k)) || null;
};

const extractGifUrl = (candidate?: ExerciseDbItem | null) => {
  const raw = candidate?.gifUrl || candidate?.gifurl || candidate?.gifURL || null;
  if (!raw) return null;
  return raw.startsWith("http://") ? raw.replace("http://", "https://") : raw;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

async function fetchGifById(apiKey: string, exerciseId: string): Promise<string | null> {
  if (!exerciseId) return null;
  const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(exerciseId)}&resolution=360`;
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" },
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "image/gif";
  const buffer = await res.arrayBuffer();
  if (!buffer.byteLength) return null;
  return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
}

// ── Scoring ──────────────────────────────────────────────────────

function scoreCandidate(inputName: string, candidate: ExerciseDbItem): number {
  const candidateName = normalize(candidate.name || "");
  const inputNorm = normalize(inputName);
  if (!candidateName) return -Infinity;

  let score = 0;

  // Exact match
  if (candidateName === inputNorm) return 200;

  // One contains the other fully
  if (candidateName.includes(inputNorm)) score += 90;
  else if (inputNorm.includes(candidateName)) score += 70;

  // Token overlap – weighted by fraction of input tokens matched
  const inputTokens = tokenize(inputName);
  const candidateTokens = new Set(tokenize(candidateName));
  let overlap = 0;
  for (const t of inputTokens) {
    if (candidateTokens.has(t)) overlap++;
  }
  if (inputTokens.length > 0) {
    const overlapRatio = overlap / inputTokens.length;
    score += Math.round(overlapRatio * 60);          // max 60
    score += overlap * 10;                            // bonus per token
  }

  // Equipment match/mismatch (strong signal)
  const inputEquip = extractEquipment(inputName);
  const candEquip = extractEquipment(candidate.equipment || candidateName);
  if (inputEquip && candEquip) {
    if (inputEquip === candEquip) score += 40;
    else score -= 50;  // heavy penalty for wrong equipment
  }

  // Movement match
  const inputMove = extractMovement(inputName);
  const candMove = extractMovement(candidateName);
  if (inputMove && candMove) {
    if (inputMove === candMove) score += 30;
    else score -= 15;
  }

  // Body part / target hint
  const hints = [candidate.target, candidate.bodyPart].filter(Boolean);
  if (hints.some((h) => inputNorm.includes(normalize(h as string)))) score += 10;

  // Penalise candidate names that are much longer (likely too specific)
  const lenDiff = candidateTokens.size - inputTokens.length;
  if (lenDiff > 3) score -= lenDiff * 4;

  return score;
}

// Minimum score to accept a match – below this we return null
const MIN_ACCEPTABLE_SCORE = 40;

// ── API helpers ──────────────────────────────────────────────────

async function callExerciseDb(apiKey: string, url: string): Promise<ExerciseDbItem[]> {
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function searchByName(apiKey: string, query: string): Promise<ExerciseDbItem[]> {
  if (!query) return [];
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=20&offset=0`;
  return callExerciseDb(apiKey, url);
}

// ── Main ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") throw new Error("Exercise name is required");

    const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
    if (!apiKey) throw new Error("EXERCISEDB_API_KEY not configured");

    const cleaned = normalize(name);
    const tokens = tokenize(name);

    // Build multiple search queries for better coverage
    const queries = new Set<string>();
    queries.add(cleaned);                                           // full name
    queries.add(tokens.slice(0, 3).join(" "));                     // first 3 tokens
    queries.add(tokens.filter((t) => !EQUIPMENT_KEYWORDS.includes(t)).join(" ")); // without equipment
    // Movement keyword alone (e.g. "curl", "squat")
    const move = extractMovement(name);
    if (move) queries.add(move);
    // Last 2 tokens (often the core movement)
    if (tokens.length >= 2) queries.add(tokens.slice(-2).join(" "));

    // Remove empty/duplicate queries
    const uniqueQueries = [...queries].filter((q) => q.length >= 3);

    // Run all searches in parallel
    const results = await Promise.all(uniqueQueries.map((q) => searchByName(apiKey, q)));
    const merged = results.flat();

    // Deduplicate by normalised name
    const uniqueByName = Array.from(
      new Map(merged.filter((e) => e?.name).map((e) => [normalize(e.name as string), e])).values()
    );

    if (uniqueByName.length === 0) {
      console.log("exercise-image no-results", JSON.stringify({ requestedName: name }));
      return new Response(JSON.stringify({ gifUrl: null, name: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Score and pick best
    const scored = uniqueByName
      .map((c) => ({ candidate: c, score: scoreCandidate(name, c) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];

    console.log("exercise-image match", JSON.stringify({
      requestedName: name,
      matchedName: best?.candidate?.name,
      matchedId: best?.candidate?.id,
      score: best?.score,
      threshold: MIN_ACCEPTABLE_SCORE,
      accepted: best?.score >= MIN_ACCEPTABLE_SCORE,
      top3: scored.slice(0, 3).map((s) => ({ name: s.candidate.name, score: s.score })),
    }));

    // Reject low-quality matches
    if (best.score < MIN_ACCEPTABLE_SCORE) {
      return new Response(JSON.stringify({ gifUrl: null, name: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let gifUrl = extractGifUrl(best.candidate);
    if (!gifUrl && best.candidate?.id) {
      gifUrl = await fetchGifById(apiKey, String(best.candidate.id));
    }

    return new Response(JSON.stringify({ gifUrl, name: best.candidate?.name || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-image error:", e);
    return new Response(JSON.stringify({ gifUrl: null, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
