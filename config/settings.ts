export const settings = () => {
  const getNameInitials = (name?: string | null) => {
    // Defensive against undefined / null / empty names so the table cell
    // never throws on a row with missing data. Also handles single-word
    // names (was previously crashing on `names[1].charAt`).
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return { getNameInitials };
};
