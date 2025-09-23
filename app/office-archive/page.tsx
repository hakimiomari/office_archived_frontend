import { Metadata } from "next";
import OfficeArchive from "@/config/archive/OfficeArchive";

export const metadata: Metadata = {
  title: "Office Archive",
  description: "A Expense tracker build using Tanstack Table.",
};

export default function page() {
  return <OfficeArchive />;
}
