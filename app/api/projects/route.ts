import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjects, saveProject } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authToken.startsWith('token_') ? authToken.replace('token_', '') : authToken;
    const projects = await getProjects(userId);

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authToken.startsWith('token_') ? authToken.replace('token_', '') : authToken;
    const { name, description, thumbnail } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = {
      id: Math.random().toString(36).substring(2, 15),
      name,
      description: description || '',
      thumbnail: thumbnail || `https://picsum.photos/seed/${Math.random()}/800/450`,
      status: 'Pre-Production',
      assetsCount: 0,
      lastEdited: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await saveProject(userId, newProject);

    return NextResponse.json({ project: newProject });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
