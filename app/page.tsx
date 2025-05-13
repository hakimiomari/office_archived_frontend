import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] align-items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <LoginForm />
    </div>
  );
}
