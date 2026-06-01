"use client";

import { useEffect, useState } from "react";
import { useUsers, UserType } from "@/config/users/users";
import { useRoles, RoleType } from "@/config/users/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRoleValue = "ADMIN" | "USER";

type Props = {
  /** Pass for edit mode; omit (or pass null/undefined) for create mode. */
  editingUser?: UserType | null;
  /** Called after a successful create/update. */
  onSuccess?: () => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
};

/**
 * Single-tenant user form.
 *
 * Create mode (no editingUser): name, email, password, permission role
 * (admin/manager/viewer), plus the app-level role (ADMIN/USER).
 *
 * Edit mode (editingUser passed): name + email + permission roles
 * (multi-select via checkboxes).
 */
export function UserForm({ editingUser, onSuccess, onCancel }: Props) {
  const { createUser, updateUser, getUser } = useUsers();
  const { getRoles } = useRoles();

  const [allRoles, setAllRoles] = useState<RoleType[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as string, // create: single role id (string)
    roleIds: [] as number[], // edit: multiple role ids
    userRole: "USER" as UserRoleValue,
  });

  useEffect(() => {
    getRoles().then(setAllRoles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When editing, hydrate the form from the full user record.
  useEffect(() => {
    if (!editingUser) return;
    let cancelled = false;
    getUser(editingUser.id).then((full: any) => {
      if (cancelled || !full) return;
      setForm((p) => ({
        ...p,
        name: full.name ?? "",
        email: full.email ?? "",
        roleIds: (full.roles ?? []).map((r: any) => r.id),
      }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingUser]);

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
    setSaving(true);
    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, {
        name: form.name,
        email: form.email,
        roleIds: form.roleIds,
      });
    } else {
      result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: parseInt(form.role) || 0,
        userRole: form.userRole,
      });
    }
    setSaving(false);
    if (result) onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="userName">Full name</Label>
          <Input
            id="userName"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userEmail">Email</Label>
          <Input
            id="userEmail"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      {!editingUser && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="userPassword">Password</Label>
            <Input
              id="userPassword"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Permission role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {editingUser && (
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
      )}

      {/* App-level role (create only). ADMIN = full system; USER = limited
          by permission gating. */}
      {!editingUser && (
        <div className="space-y-2">
          <Label>App role</Label>
          <Select
            value={form.userRole}
            onValueChange={(v) =>
              setForm((p) => ({ ...p, userRole: v as UserRoleValue }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editingUser
              ? "Update user"
              : "Create user"}
        </Button>
      </div>
    </form>
  );
}
