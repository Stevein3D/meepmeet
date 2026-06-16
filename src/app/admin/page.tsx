import Link from 'next/link';
import { UserRoleManager } from '@/components/UserRoleManager';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <Link href="/admin/email" className="btn btn-sm btn-secondary">
          Compose Email →
        </Link>
      </div>
      <UserRoleManager />
    </div>
  );
}
