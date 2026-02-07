import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
// export const expenseSchema = z.object({
//   id: z.string(),
//   label: z.string(),
//   note: z.string(),
//   category: z.string(),
//   type: z.enum(["income", "expense"]),
//   amount: z.number(),
//   date: z.string(),
// });

export const expenseSchema = z.object({
  id: z.string(),
  memo: z.string(),
  title: z.string(),
  register_number: z.string(),
  date_exported_or_received: z.string(),
  note: z.string(),
  file_number: z.number(),
  archive_category: z.string(),
  type: z.enum(["income", "expense"]),
  created_at: z.string(),
  created_by: z.number(),
  updated_at: z.string(),
  updated_by: z.number(),
});

export type Expense = z.infer<typeof expenseSchema>;
