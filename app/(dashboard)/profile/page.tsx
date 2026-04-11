"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { useUsers } from "@/config/users/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { settings } from "@/config/settings";
import {
  IconCamera,
  IconUpload,
  IconUser,
  IconLock,
  IconMail,
  IconShieldLock,
  IconCalendar,
} from "@tabler/icons-react";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const { updateProfile, changePassword, uploadProfilePicture } = useUsers();
  const { getNameInitials } = settings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    const result = await updateProfile(profileForm);
    if (result) {
      setUser((prev: any) => ({
        ...prev,
        name: result.name,
        email: result.email,
      }));
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert("Passwords do not match");
    }
    setPasswordLoading(true);
    const success = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (success) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setPasswordLoading(false);
  };

  const handlePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const result = await uploadProfilePicture(file);
    if (result) {
      setUser((prev: any) => ({
        ...prev,
        profile_picture: result.profile_picture,
      }));
    }
    setUploadLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary"
            style={{ animationDuration: "0.6s" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          {/* Avatar with upload */}
          <div className="relative group shrink-0">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg sm:h-28 sm:w-28">
              <AvatarImage
                src={
                  (user as any).profile_picture ||
                  (user as any).avatar ||
                  undefined
                }
                alt={user.name}
              />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary sm:text-3xl">
                {getNameInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-all duration-200 group-hover:opacity-100 disabled:cursor-not-allowed"
            >
              {uploadLoading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <IconCamera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePictureUpload}
            />
          </div>

          {/* User info */}
          <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">
                {user.name}
              </h1>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <IconMail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(user as any).roles?.map((role: any) => (
                <Badge key={role.id} variant="secondary" className="gap-1">
                  <IconShieldLock className="h-3 w-3" />
                  {role.name}
                </Badge>
              ))}
              {(user as any).created_at && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <IconCalendar className="h-3 w-3" />
                  Joined{" "}
                  {new Date((user as any).created_at).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
            >
              {uploadLoading ? (
                <>
                  <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 h-3.5 w-3.5" />
                  Change Photo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabbed Settings */}
      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <IconUser className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <IconLock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details. These will be visible to other
                users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="grid gap-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Full Name</Label>
                    <div className="relative">
                      <IconUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="profileName"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="pl-9"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Email Address</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="profileEmail"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="pl-9"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Choose a strong password with at least 6 characters to keep your
                account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="grid gap-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="pl-9"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }))
                        }
                        className="pl-9"
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="pl-9"
                        placeholder="Repeat new password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                        Changing...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
