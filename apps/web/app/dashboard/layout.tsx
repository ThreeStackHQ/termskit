import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardTopbar } from '@/components/DashboardTopbar';

const WORKSPACE_NAME = 'My Workspace';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardSidebar workspaceName={WORKSPACE_NAME} />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <DashboardTopbar workspaceName={WORKSPACE_NAME} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
