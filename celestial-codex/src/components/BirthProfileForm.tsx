import React, { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./Input";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { Spinner } from "./Spinner";
import { useDebounce } from "../helpers/useDebounce";
import { useCodexQueries } from "../helpers/useCodexQueries";
import type { BirthProfile } from "../helpers/BirthProfile";
import styles from "./BirthProfileForm.module.css";

interface BirthProfileFormProps {
  initial?: BirthProfile | null;
  defaultName?: string;
  onSaved?: () => void;
  submitLabel?: string;
  className?: string;
}

export const BirthProfileForm = ({ initial, defaultName, onSaved, submitLabel = "Cast my Codex", className }: BirthProfileFormProps) => {
  const [fullName, setFullName] = useState(initial?.fullName ?? defaultName ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [knowsTime, setKnowsTime] = useState(initial ? initial.birthTime !== null : true);
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "12:00");
  const [placeQuery, setPlaceQuery] = useState(initial?.birthPlace ?? "");
  const [place, setPlace] = useState<{ label: string; latitude: number; longitude: number; timezone: string } | null>(
    initial && initial.latitude !== null && initial.longitude !== null
      ? { label: initial.birthPlace ?? "", latitude: initial.latitude, longitude: initial.longitude, timezone: initial.timezone }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(placeQuery, 350);
  const searching = !place || place.label !== placeQuery;
  const places = useCodexQueries.usePlaces(searching ? debounced : "");
  const save = useCodexQueries.useSaveProfile();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Tell the Codex the full name you were given at birth.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return setError("Choose your date of birth.");
    if (!place) return setError("Search for and select your place of birth.");
    save.mutate(
      {
        fullName: fullName.trim(),
        birthDate,
        birthTime: knowsTime ? birthTime : null,
        birthPlace: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
      },
      {
        onSuccess: () => {
          toast.success("Your stars have been inscribed.");
          onSaved?.();
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
      }
    );
  };

  return (
    <form onSubmit={submit} className={`${styles.form} ${className ?? ""}`}>
      <label className={styles.field}>
        <span className={styles.label}>Full birth name</span>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As written on your birth certificate" autoComplete="name" />
        <span className={styles.help}>Numerology reads every letter, so use the name you were given.</span>
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Date of birth</span>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max="2100-12-31" min="1900-01-01" />
        </label>
        <div className={styles.field}>
          <span className={styles.label}>Time of birth</span>
          <Input type="time" value={birthTime} disabled={!knowsTime} onChange={(e) => setBirthTime(e.target.value)} />
          <label className={styles.switchRow}>
            <Switch checked={!knowsTime} onCheckedChange={(v) => setKnowsTime(!v)} />
            <span>I don't know my birth time</span>
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Place of birth</span>
        <div className={styles.placeWrap}>
          <MapPin size={16} className={styles.placeIcon} />
          <Input
            className={styles.placeInput}
            value={placeQuery}
            onChange={(e) => {
              setPlaceQuery(e.target.value);
              if (place && e.target.value !== place.label) setPlace(null);
            }}
            placeholder="Search a city, e.g. Orlando"
          />
          {places.isFetching && <Spinner size="sm" className={styles.placeSpinner} />}
        </div>
        {searching && debounced.trim().length >= 2 && (places.data?.length ?? 0) > 0 && (
          <ul className={styles.results}>
            {places.data!.map((p) => (
              <li key={`${p.latitude},${p.longitude}`}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={() => {
                    setPlace(p);
                    setPlaceQuery(p.label);
                  }}
                >
                  <span>{p.label}</span>
                  <span className={styles.coords}>
                    {p.latitude.toFixed(2)}°, {p.longitude.toFixed(2)}° · {p.timezone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {place && !searching && (
          <span className={styles.chosen}>
            <Check size={14} /> {place.latitude.toFixed(3)}°, {place.longitude.toFixed(3)}° · {place.timezone}
          </span>
        )}
        {!knowsTime && <span className={styles.help}>Without a birth time the Moon's degree is approximate and houses and Ascendant are omitted.</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" size="lg" disabled={save.isPending} className={styles.submit}>
        {save.isPending ? (
          <>
            <Spinner size="sm" /> Consulting the heavens…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
};
