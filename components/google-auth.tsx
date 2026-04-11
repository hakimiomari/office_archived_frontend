import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "@/config/auth";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "289417890821-cjei9u9q078sfp6vkvejk5qo5bviuoeq.apps.googleusercontent.com";

const GoogleAuth = () => {
  const { googleAuth, isGoogleLoading } = useAuth();
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="relative">
        {isGoogleLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
        )}
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            googleAuth(credentialResponse);
          }}
          onError={() => {
            // Error is handled via toast in the auth hook
          }}
          useOneTap
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
