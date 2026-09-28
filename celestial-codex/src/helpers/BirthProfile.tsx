export type BirthProfile = {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm
  birthPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};
