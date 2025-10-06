import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "@/config/auth";

const GoogleAuth = () => {
  const { googleAuth } = useAuth();
  return (
    <GoogleOAuthProvider clientId="289417890821-cjei9u9q078sfp6vkvejk5qo5bviuoeq.apps.googleusercontent.com">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          googleAuth(credentialResponse);
        }}
        onError={() => {
          console.log("Login Failed");
        }}
        useOneTap
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
