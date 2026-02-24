import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.' },
      { status: 500 }
    );
  }

  // Use the request URL to determine the origin for the redirect URI
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ url: authUrl });
}
