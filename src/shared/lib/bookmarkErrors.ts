export function isMissingBookmarksTableError(error: {
  code?: string;
  message: string;
}) {
  return (
    error.code === "42P01" ||
    error.message.includes("hospital_bookmarks") ||
    error.message.includes("schema cache")
  );
}
