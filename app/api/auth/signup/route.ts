import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Here you would typically hash the password and save the user to a database
    // For now, we'll just simulate a successful signup
    
    const response = NextResponse.json(
      { message: 'User created successfully', user: { fullName, email } },
      { status: 201 }
    );

    // Set a mock session cookie so the user is logged in
    response.cookies.set('auth_token', `mock_token_${email}`, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
