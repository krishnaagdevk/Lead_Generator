import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let brandName: string | null = null;
  let brandLogo: string | null = null;
  let brandColor: string | null = null;

  try {
    const session = await getSession();
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { brandName: true, brandLogo: true, brandColor: true, whiteLabel: true },
      });
      if (user?.whiteLabel) {
        brandName = user.brandName;
        brandLogo = user.brandLogo;
        brandColor = user.brandColor;
      }
    }
  } catch {}

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar brandName={brandName} brandLogo={brandLogo} brandColor={brandColor} />
      <main className="flex-1 min-w-0 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}