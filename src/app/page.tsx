import { redirect } from "next/navigation";
import { getCurrentMonthYear } from "@/lib/date/months";

export default async function Home() {
  const { year, month } = getCurrentMonthYear();
  redirect(`/${year}/${month}`);
}
