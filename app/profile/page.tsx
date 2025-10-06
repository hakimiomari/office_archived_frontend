import DashboardLayout from "../layouts/DashboardLayout";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground/60">
            This information can be edited in the settings.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
