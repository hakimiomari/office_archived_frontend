import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function Profile() {
  return (
    <div className="flex theme-mono flex-col">
      <div className="profile min-w-[270px] min-h-2"></div>
      <div className="flex flex-col gap-4 bg-white">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground/60">
          This information can be edited in the settings.
        </p>
      </div>
    </div>
  );
}
