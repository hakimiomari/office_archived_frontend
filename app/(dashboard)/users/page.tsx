"use client";

import { useEffect, useState } from "react";
import { useUsers, UserType, UserMeta } from "@/config/users/users";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { settings } from "@/config/settings";

export default function UsersPage() {
  const { getUsers, deleteUser } = useUsers();
  const { changeRoute } = nextRoute();
  const { getNameInitials } = settings();
  const [users, setUsers] = useState<UserType[]>([]);
  const [meta, setMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true);
    const result = await getUsers(p, 10, s);
    setUsers(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, search);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      const success = await deleteUser(id);
      if (success) fetchUsers();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => changeRoute("/users/create")}>
          <IconPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">#</TableHead>
              <TableHead className="px-4 py-2">User</TableHead>
              <TableHead className="px-4 py-2">Email</TableHead>
              <TableHead className="px-4 py-2">Roles</TableHead>
              <TableHead className="px-4 py-2">Auth Method</TableHead>
              <TableHead className="px-4 py-2">Created</TableHead>
              <TableHead className="px-4 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-2">
                    {((meta?.page || 1) - 1) * (meta?.limit || 10) + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.profile_picture || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {getNameInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">{user.email}</TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No role
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant={user.googleId ? "outline" : "default"}>
                      {user.googleId ? "Google" : "Email"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            changeRoute(`/users/${user.id}/edit`)
                          }
                        >
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <IconChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
