import { useRouter } from "next/navigation";
export const nextRoute = () => {
  const router = useRouter();
  const changeRoute = (url: string) => {
    router.push(url);
  };

  return { changeRoute };
};
