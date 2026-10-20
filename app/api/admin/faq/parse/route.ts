import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mammoth from 'mammoth';
import { MAX_FAQS } from '@/lib/siteConfig';

// A category header is a short, all-caps-ish line with no terminal
// punctuation of its own — e.g. "SHIPPING & DELIVERY". Numbered questions
// always end in "?", which a heading never does, so that's the tie-breaker.
function isCategoryHeading(line: string): boolean {
  if (line.length === 0 || line.length > 60) return false;
  if (line.endsWith('?') || line.endsWith('.') || line.endsWith(',')) return false;
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (letters.length === 0) return false;
  return letters === letters.toUpperCase();
}

function titleCase(line: string): string {
  return line
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/&\s*/g, '& ');
}

const QUESTION_RE = /^\d+[.)]\s*(.+)$/;

function parseFaqText(rawText: string): { intro: string; faqs: { category: string; question: string; answer: string }[] } {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const faqs: { category: string; question: string; answer: string }[] = [];
  const introLines: string[] = [];
  let category = '';
  let current: { category: string; question: string; answer: string } | null = null;

  for (const line of lines) {
    const questionMatch = line.match(QUESTION_RE);
    const isQuestion = Boolean(questionMatch && questionMatch[1].trim().endsWith('?'));

    if (isQuestion && questionMatch) {
      if (current) faqs.push(current);
      current = { category, question: questionMatch[1].trim(), answer: '' };
      continue;
    }

    if (isCategoryHeading(line)) {
      category = titleCase(line);
      if (current) {
        faqs.push(current);
        current = null;
      }
      continue;
    }

    if (current) {
      current.answer = current.answer ? `${current.answer} ${line}` : line;
    } else {
      introLines.push(line);
    }
  }
  if (current) faqs.push(current);

  // Drop a leading title line like "Frequently Asked Questions (FAQs)" —
  // the FAQ page already renders its own heading, so keeping it would
  // just repeat the title right above itself.
  if (introLines[0]?.toLowerCase().includes('frequently asked questions')) {
    introLines.shift();
  }

  return { intro: introLines.join(' '), faqs: faqs.slice(0, MAX_FAQS) };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'Please upload a .docx file.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: text } = await mammoth.extractRawText({ buffer });
    const { intro, faqs } = parseFaqText(text);

    if (faqs.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find any numbered questions ending in \"?\" in that document." },
        { status: 400 }
      );
    }

    return NextResponse.json({ intro, faqs });
  } catch {
    return NextResponse.json({ error: 'Could not read that document.' }, { status: 400 });
  }
}
