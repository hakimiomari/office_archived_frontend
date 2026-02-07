import { cookies } from "next/headers";

const BASE_URL = "http://localhost:8001/api";

export async function getArchivesServer() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const response = await fetch(`${BASE_URL}/archives`, {
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
    cache: "no-store", // or use revalidate for caching
  });

  if (!response.ok) {
    throw new Error("Failed to fetch archives");
  }

  return response.json();
}
