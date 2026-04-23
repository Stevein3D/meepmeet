import { NextResponse } from 'next/server'
import { sendNewUserNotificationEmail } from '@/lib/email'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    await sendNewUserNotificationEmail({
      name: 'Test User',
      email: 'testuser@example.com',
      clerkId: 'user_test_dev123',
    })
    return NextResponse.json({ ok: true, message: 'Test email sent to meepmail@meepmeet.club' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
