import api from "@/lib/api/axios";
import { useArchive } from "@/contexts/ArchiveContext";
export const useArchives = () => {
  const { setArchive } = useArchive();
  const getArchives = async () => {
    try {
      const response = await api.get("archives");
      if (response.status == 200) {
        console.log(response.data);
        setArchive(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return { getArchives };
};
