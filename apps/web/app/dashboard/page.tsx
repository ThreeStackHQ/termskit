import { redirect } from 'next/navigation';

// Server component — requires auth
// TODO: Replace with real session check via next-auth getServerSession
async function getSession() {
  // Stub: in production, use getServerSession(authOptions)
  return null;
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      </header>
      <div className="flex-1 p-6">
        <p className="text-gray-500">Welcome to TermsKit. Dashboard coming soon.</p>
      </div>
    </main>
  );
}
