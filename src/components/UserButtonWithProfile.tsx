'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export default function UserButtonWithProfile() {
  const { user } = useUser()

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="View Profile"
          labelIcon={<span>👤</span>}
          href={`/meeps/${user?.id}`}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
