"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUsers } from "@/config/users/users";
import { useRoles, RoleType } from "@/config/users/roles";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id);
  const { getUser, updateUser } = useUsers();
  const { getRoles } = useRoles();
  const { changeRoute } = nextRoute();

  const [allRoles, setAllRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    roleIds: [] as number[],
  });

  useEffect(() => {
    const fetch = async () => {
      const [user, roles] = await Promise.all([getUser(userId), getRoles()]);
      setAllRoles(roles);
      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          roleIds: user.roles.map((r: any) => r.id),
        });
      }
      setFetching(false);
    };
    fetch();
  }, [userId]);

  const toggleRole = (roleId: number) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateUser(userId, {
      name: form.name,
      email: form.email,
      roleIds: form.roleIds,
    });
    setLoading(false);
    if (result) changeRoute("/users");
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-3 rounded-md border p-4 md:grid-cols-3">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={form.roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="cursor-pointer capitalize"
                    >
                      {role.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => changeRoute("/users")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Update User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
