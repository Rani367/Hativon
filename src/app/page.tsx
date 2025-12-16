import { redirect } from "next/navigation";
import { getCurrentMonthYear } from "@/lib/date/months";

// Pre-render homepage and revalidate daily (redirect changes only monthly)
export const revalidate = 86400; // 24 hours

export default async function Home() {
  const { year, month } = getCurrentMonthYear();
  redirect(`/${year}/${month}`);
}
