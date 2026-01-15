import { NextRequest, NextResponse } from 'next/server';
import { loginAction } from '@/lib/server/actions/auth';

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await loginAction(data);
  return NextResponse.json(result);
}
