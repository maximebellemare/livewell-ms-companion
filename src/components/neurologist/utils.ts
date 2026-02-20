export const formatDrName = (name: string | null | undefined): string | null => {
  if (!name) return null;
  return name.match(/^dr\.?\s/i) ? name : `Dr. ${name}`;
};
