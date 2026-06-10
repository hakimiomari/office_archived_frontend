import { Logo } from "@/components/logo";
import { RegisterForm } from "@/components/register-form";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a
          href="/"
          className="flex items-center gap-2 self-center text-lg font-semibold"
        >
          <Logo className="size-8" />
          Zermatoon
        </a>
        <RegisterForm />
      </div>
    </div>
  );
}
