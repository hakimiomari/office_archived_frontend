export const truncateText = (text: string, limit = 20) => {
  if (!text) return "";

  return text.length > limit ? text.slice(0, limit).trim() + "..." : text;
};
