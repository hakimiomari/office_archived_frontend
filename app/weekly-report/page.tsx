"use client";
import DashboardLayout from "../layouts/DashboardLayout";
import { useUser } from "@/contexts/UserContext";

export default function WeeklyReport() {
  const { user } = useUser();
  return (
    <DashboardLayout>
      <div>Weekly Report</div>
      <div>{user && user.name}</div>
    </DashboardLayout>
  );
}
