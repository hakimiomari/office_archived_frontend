"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/config/auth";
import React from "react";
import { Loader2 } from "lucide-react";
import GoogleAuth from "./google-auth";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loginInfo, setLoginInfo] = React.useState({
    email: "",
    password: "",
  });

  const { login, isLoading } = useAuth();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("welcomeBack")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => login(event, loginInfo)}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <GoogleAuth />
                <Button
                  variant="outline"
                  type="button"
                  className="w-full flex justify-center cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="#A2AAAD"
                    />
                  </svg>
                  {t("loginWithApple")}
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  {t("orContinueWith")}
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">{tCommon("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={loginInfo.email}
                    onChange={(e) =>
                      setLoginInfo({ ...loginInfo, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">{tCommon("password")}</Label>
                    <a
                      href="#"
                      className="ms-auto text-sm underline-offset-4 hover:underline"
                    >
                      {t("forgotPassword")}
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={loginInfo.password}
                    onChange={(e) =>
                      setLoginInfo({ ...loginInfo, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="w-full cursor-pointer"
                >
                  {isLoading && <Loader2 className="animate-spin" />}
                  {t("login")}
                </Button>
              </div>
              <div className="text-center text-sm">
                {t("noAccount")}{" "}
                <a href="#" className="underline underline-offset-4">
                  {t("signUp")}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("termsAgreement")} <a href="#">{t("termsOfService")}</a>{" "}
        {t("and")} <a href="#">{t("privacyPolicy")}</a>.
      </div>
    </div>
  );
}
