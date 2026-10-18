import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      {/* Admin Top Header */}
      <AdminHeader />

      {/* Main Body with Sticky Sidebar & Dashboard Content */}
      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 flex-center p-4 md:p-8">
          <div className="card p-8 text-center max-w-md w-full">
            <h1 className="page-title">Welcome Admin</h1>
          </div>
        </main>
      </div>
    </div>
  );
}
