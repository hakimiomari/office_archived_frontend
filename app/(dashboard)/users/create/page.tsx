"use client";

import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/user-form";

export default function CreateUserPage() {
  const { changeRoute } = nextRoute();

  return (
    <RouteGuard permission="user.create">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              onSuccess={() => changeRoute("/users")}
              onCancel={() => changeRoute("/users")}
            />
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
