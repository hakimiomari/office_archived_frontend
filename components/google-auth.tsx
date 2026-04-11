"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "@/config/auth";
import { Button } from "@/components/ui/button";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "289417890821-cjei9u9q078sfp6vkvejk5qo5bviuoeq.apps.googleusercontent.com";

function GoogleLoginButton() {
  const { googleAuth, isGoogleLoading } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            googleAuth({ credential: response.credential });
          },
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        initialized.current = true;
      }
    };
    document.head.appendChild(script);
    return () => {
      try {
        document.head.removeChild(script);
      } catch {}
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isGoogleLoading) return;
    const google = (window as any).google;
    if (google?.accounts?.id && initialized.current) {
      google.accounts.id.prompt((notification: any) => {
        // If One Tap is not available (dismissed, cooldown, etc), fall back to button flow
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          // Render a hidden Google sign-in button and click it
          const btnDiv = document.createElement("div");
          btnDiv.style.display = "none";
          document.body.appendChild(btnDiv);
          google.accounts.id.renderButton(btnDiv, {
            type: "icon",
            size: "large",
          });
          const btn = btnDiv.querySelector('[role="button"]') as HTMLElement;
          if (btn) btn.click();
          setTimeout(() => document.body.removeChild(btnDiv), 1000);
        }
      });
    }
  }, [isGoogleLoading]);

  return (
    <Button
      variant="outline"
      className="w-full flex justify-center cursor-pointer"
      type="button"
      onClick={handleClick}
      disabled={isGoogleLoading}
    >
      {isGoogleLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
      )}
      Login with Google
    </Button>
  );
}

const GoogleAuth = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLoginButton />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
