import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  // In a real app, exchange code for tokens here
  // For now, we just send the success message to the popup opener

  const html = `
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/dashboard';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `;

  const response = new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });

  // Set a mock session cookie
  response.cookies.set('auth_token', 'mock_google_token_123', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  return response;
}
