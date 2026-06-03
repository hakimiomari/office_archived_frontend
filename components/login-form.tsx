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
import { useTranslations } from "next-intl";

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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("welcomeBack")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => login(event, loginInfo)}>
            <div className="grid gap-6">
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
