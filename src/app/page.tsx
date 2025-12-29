import { redirect } from "next/navigation";
import { getDefaultMonthWithFallback } from "@/lib/settings";

// Pre-render homepage and revalidate every 5 minutes
// (to pick up default month changes from admin panel)
export const revalidate = 300; // 5 minutes

export default async function Home() {
  const { year, month } = await getDefaultMonthWithFallback();
  redirect(`/${year}/${month}`);
}
