import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to the existing favicon.ico
  return NextResponse.redirect(new URL('/favicon.ico', request.url));
} 