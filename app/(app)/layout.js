import { headers } from "next/headers";
import AppNav from "@/components/AppNav";

export default async function AppLayout({ children }) {
  const headersList = await headers();
  const role = headersList.get("x-user-role") || "employe";

  return (
    <div className="px-4 pb-16">
      <AppNav role={role} />
      <main className="pt-4">{children}</main>
    </div>
  );
}
