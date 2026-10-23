import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAsteroids } from "../endpoints/points/asteroids_GET.schema";
import { getProfile } from "../endpoints/profile_GET.schema";
import { postProfile, type InputType as ProfileInput } from "../endpoints/profile_POST.schema";
import { getGeocode } from "../endpoints/geocode_GET.schema";
import { postHoroscope } from "../endpoints/horoscope_POST.schema";
import type { HoroscopeDepthKind, HoroscopePeriodKind } from "./Horoscope";
import type { BirthProfile } from "./BirthProfile";
import { astroEngine } from "./astroEngine";
import { birthInstant } from "./birthInstant";
import { humanDesignEngine } from "./humanDesignEngine";
import { numerologyEngine } from "./numerologyEngine";
import { buildCosmicContext } from "./buildCosmicContext";
import { horoscopePeriod } from "./horoscopePeriod";

export const PROFILE_KEY = ["birthProfile"] as const;

export const useCodexQueries = {
  useProfile: () =>
    useQuery({ queryKey: PROFILE_KEY, queryFn: async () => (await getProfile()).profile }),

  useSaveProfile: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: ProfileInput) => postProfile(input),
      onSuccess: (data) => {
        qc.setQueryData(PROFILE_KEY, data.profile);
        qc.removeQueries({ queryKey: ["horoscope"] });
      },
    });
  },

  usePlaces: (q: string) =>
    useQuery({
      queryKey: ["geocode", q],
      queryFn: async () => (await getGeocode({ q })).places,
      enabled: q.trim().length >= 2,
      staleTime: 5 * 60 * 1000,
      placeholderData: (prev) => prev,
    }),

  useHoroscope: (period: HoroscopePeriodKind, localDate: string, profile: BirthProfile | null | undefined, depth: HoroscopeDepthKind = "standard", enabled = true) => {
    const qc = useQueryClient();
    return useQuery({
      queryKey: ["horoscope", period, localDate, depth],
      queryFn: async () => {
        let deep: { asteroids: Awaited<ReturnType<typeof getAsteroids>>["asteroids"] | null } | undefined;
        if (depth === "deep") {
          const asteroids = await qc
            .fetchQuery({
              queryKey: ["asteroids", profile!.birthDate, profile!.birthTime, profile!.timezone],
              queryFn: async () => (await getAsteroids()).asteroids,
              staleTime: Infinity,
            })
            .catch(() => null);
          deep = { asteroids };
        }
        const { text, transits } = buildCosmicContext(profile!, horoscopePeriod(period, localDate).at, deep);
        return (await postHoroscope({ period, localDate, dossier: text, transits, depth })).horoscope;
      },
      enabled: !!profile && enabled,
      staleTime: Infinity,
      retry: false,
    });
  },

  useBlueprint: (profile: BirthProfile | null | undefined) =>
    useMemo(() => {
      if (!profile) return null;
      const instant = birthInstant(profile.birthDate, profile.birthTime, profile.timezone);
      const loc =
        profile.birthTime && profile.latitude !== null && profile.longitude !== null
          ? { latitude: profile.latitude, longitude: profile.longitude }
          : null;
      return {
        instant,
        natal: astroEngine(instant, loc),
        hd: humanDesignEngine(instant),
        numbers: numerologyEngine(profile.fullName, profile.birthDate),
      };
    }, [profile]),
};

export function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
