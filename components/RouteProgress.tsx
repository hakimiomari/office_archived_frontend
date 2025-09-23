"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
// import { NProgress } from "@tanem/react-nprogress";

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });
export default function RouteProgress() {
  const pathname = usePathname();
  // const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    NProgress.start();

    NProgress.done();
  }, [pathname]);

  return null;

  // return (
  //   <NProgress isAnimating={isAnimating}>
  //     {({ isFinished, progress }) => {
  //       if (isFinished) {
  //         setTimeout(() => setIsAnimating(false), 0); // no visual delay
  //       }
  //       return (
  //         <div
  //           style={{
  //             opacity: isFinished ? 0 : 1,
  //             pointerEvents: "none",
  //             position: "fixed",
  //             top: 0,
  //             left: 0,
  //             width: "100%",
  //             height: 3,
  //             zIndex: 1031,
  //             background: "#29d",
  //             transform: `scaleX(${progress})`,
  //             transformOrigin: "left",
  //             transition: "transform 0.2s ease-out, opacity 0.2s ease-out",
  //           }}
  //         />
  //       );
  //     }}
  //   </NProgress>
  // );
}
