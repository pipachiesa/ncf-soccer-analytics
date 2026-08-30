export type ProfileRole = "admin" | "importer" | "viewer";

export type CurrentProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
};
