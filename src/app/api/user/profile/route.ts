import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserById } from '@/lib/user-service';

export async function GET() {
  try {
    // Get the current user from Clerk
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find user in your database by email
    // You might need to adjust this based on how you're storing users
    const dbUser = await prisma.user.findFirst({
      where: { email: clerkUser.emailAddresses[0]?.emailAddress }
    });

    if (!dbUser) {
      // If user doesn't exist in your DB, create them with default VISITOR role
      const newUser = await prisma.user.create({
        data: {
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          avatar: clerkUser.imageUrl,
          role: 'VISITOR',
        },
      });
      
      return NextResponse.json(newUser);
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
