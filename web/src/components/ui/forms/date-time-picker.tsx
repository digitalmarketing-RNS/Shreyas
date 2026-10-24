"use client";

import { Plus, TriangleAlert } from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE } from "@/lib/format";
import { Button } from "../button";
import { Combobox, type ComboboxOption } from "./combobox";
import { DatePicker } from "./date-picker";
import { MONTHS_SHORT, type PlainDate, formatWeekdayDate, fromIso, sameDay, toIso, todayIn } from "./dates";
import { Field } from "./field";
import { joinIds } from "./field-context";
import { FieldGroup } from "./field-group";
import { useIsClient } from "./hooks";
import { InlineAlert } from "./inline-alert";
import { TimeField } from "./time-field";
import {
  type PlainTime,
  browserZone,
  canonicalZone,
  formatOffset,
  formatTime12,
  listZones,
  utcToZoned,
  zoneCity,
  zoneLabel,
  zoneLongName,
  zoneOffsetMinutes,
  zoneShortName,
  zonedToUtc,
} from "./times";

export type DateTimeValue = {
  /** ISO 8601 UTC instant (follow_ups.starts_at). */
  startsAt: string;
  /** IANA name (follow_ups.timezone). */
  timezone: string;
  endsAt?: string | null;
};

export type DateTimePickerProps = {
  legend?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Hidden inputs: `{name}_starts_at`, `{name}_timezone`, `{name}_ends_at`. */
  name?: string;
  /** Starting values: ISO date, "16:30", IANA zone. A stored value shows in its own stored zone. */
  defaultDate?: string;
  defaultTime?: string;
  defaultZone?: string;
  /** The institution's zone (Asia/Kolkata). */
  orgZone?: string;
  /** false: the zone is fixed to the institution's and shown as "Times in IST". */
  zonePicker?: boolean;
  recentZones?: string[];
  /** S11: "Add end time" reveals a second time field. */
  withEndTime?: boolean;
  /** Past moments are an error rather than a warning. */
  forbidPast?: boolean;
  /**
   * The owner already has a follow-up within 30 minutes (S11, S12). A warning, never an error.
   * Pass the message, or `checkClash` to ask the server once date, time and zone are valid.
   */
  clash?: string | null;
  checkClash?: (value: DateTimeValue) => Promise<string | null>;
  onValueChange?: (value: DateTimeValue | null) => void;
  /** The current instant (ISO), for the past and "within 24 hours" checks; the page's load time by default. */
  now?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
};

function parseClock(value: string | undefined): PlainTime | null {
  const match = value ? /^(\d{1,2}):(\d{2})$/.exec(value) : null;
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function loadTime(): number {
  return Date.now();
}

/**
 * A moment: a date, a time and the time zone it belongs to (components.md DateTimePicker), for
 * follow-ups and scheduled sends. A fieldset with three labelled parts (DatePicker, a time field
 * with a 15-minute list, a time-zone Combobox), then a summary line that says how it was read.
 *
 * - The summary ("Tue, 06 Oct 2026, 4:30 pm IST") is a polite status: screen-reader users hear the
 *   resolved moment once after a change. A second line converts it to the viewer's own zone when
 *   that differs.
 * - A time skipped by clocks going forward is an error; a time that happens twice takes its first
 *   occurrence and shows the offset. A past moment is a warning unless the consumer forbids it.
 * - The clash warning never names the other lead. It has no live role of its own; the summary
 *   status adds its sentence once.
 * - Tab order: date, calendar button, time, time zone.
 */
export function DateTimePicker({
  legend = "When",
  hint,
  error,
  name,
  defaultDate,
  defaultTime,
  defaultZone,
  orgZone = DEFAULT_TIME_ZONE,
  zonePicker = true,
  recentZones = [],
  withEndTime = false,
  forbidPast = false,
  clash: clashProp = null,
  checkClash,
  onValueChange,
  now: nowProp,
  size = "md",
  disabled = false,
  readOnly = false,
  className,
}: DateTimePickerProps) {
  const base = useId();
  const warningId = `${base}-warning`;
  const clashId = `${base}-clash`;
  const isClient = useIsClient();
  const [loadedAt] = useState(loadTime);
  const now = nowProp ? Date.parse(nowProp) : loadedAt;

  const [date, setDate] = useState<PlainDate | null>(fromIso(defaultDate));
  const [time, setTime] = useState<PlainTime | null>(parseClock(defaultTime));
  const [zone, setZone] = useState(canonicalZone(defaultZone ?? orgZone));
  const [showEnd, setShowEnd] = useState(false);
  const [endTime, setEndTime] = useState<PlainTime | null>(null);
  const [checkedClash, setCheckedClash] = useState<{ key: string; message: string | null } | null>(null);
  const viewerZone = useMemo(() => (isClient ? browserZone() : null), [isClient]);

  // -- the moment ------------------------------------------------------------------------------
  const resolved = date && time ? zonedToUtc(date, time, zone) : null;
  const startsAtMs = resolved && resolved.status !== "gap" ? resolved.utcMs : null;
  const endResolved = date && endTime ? zonedToUtc(date, endTime, zone) : null;
  const endsAtMs = endResolved && endResolved.status !== "gap" ? endResolved.utcMs : null;
  const endProblem = startsAtMs !== null && endsAtMs !== null && endsAtMs <= startsAtMs ? "Choose an end time after the start." : null;

  const value: DateTimeValue | null =
    startsAtMs !== null
      ? { startsAt: new Date(startsAtMs).toISOString(), timezone: zone, endsAt: endsAtMs !== null ? new Date(endsAtMs).toISOString() : null }
      : null;
  const valueKey = value ? `${value.startsAt}|${value.timezone}` : "";

  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  });
  useEffect(() => {
    onValueChangeRef.current?.(value);
    // valueKey and the end time describe the value completely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, value?.endsAt]);

  // Clash check: once date, time and zone are valid, against the owner's open follow-ups.
  useEffect(() => {
    if (!checkClash || !value) return;
    let cancelled = false;
    const key = valueKey;
    checkClash(value).then((message) => {
      if (!cancelled) setCheckedClash({ key, message });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, checkClash]);
  const clash = checkClash ? (checkedClash && checkedClash.key === valueKey ? checkedClash.message : null) : clashProp;

  const gapMessage =
    resolved?.status === "gap" && date && time
      ? `${formatTime12(time)} doesn't exist in ${zoneCity(zone)} on ${date.day} ${MONTHS_SHORT[date.month - 1]} ${date.year}, because clocks go forward. Pick another time.`
      : null;

  const isPast = startsAtMs !== null && startsAtMs < now;
  const pastProblem = isPast && forbidPast ? "Choose a time in the future." : null;
  const pastWarning = isPast && !forbidPast ? "This time has passed. The follow-up will show as overdue." : null;

  let summary = "";
  if (date && time && startsAtMs !== null) {
    const offset = resolved?.status === "ambiguous" ? ` (${formatOffset(zoneOffsetMinutes(zone, startsAtMs))})` : "";
    summary = `${formatWeekdayDate(date)}, ${formatTime12(time)} ${zoneShortName(zone, startsAtMs)}${offset}`;
  }

  let viewerLine: string | null = null;
  if (viewerZone && viewerZone !== zone && startsAtMs !== null && date) {
    const local = utcToZoned(startsAtMs, viewerZone);
    const day = sameDay(local.date, date) ? "" : ` on ${formatWeekdayDate(local.date)}`;
    viewerLine = `That's ${formatTime12(local.time)}${day} for you (${zoneLongName(viewerZone, startsAtMs)}).`;
  }
  const closeInTime = startsAtMs !== null && Math.abs(startsAtMs - now) <= 24 * 3_600_000;
  const zoneAlert = viewerLine && closeInTime;

  // -- zone options, labelled for the chosen date -------------------------------------------------
  const labelAt = date ? Date.UTC(date.year, date.month - 1, date.day, 12) : now;
  const recentKey = recentZones.join(",");
  const zoneOptions = useMemo(() => buildZoneOptions(orgZone, viewerZone, recentKey, labelAt), [orgZone, viewerZone, recentKey, labelAt]);

  if (readOnly) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-sm font-medium text-fg">{legend}</span>
        <span className="text-sm text-fg">{summary || "Not set"}</span>
      </div>
    );
  }

  const groupError = error ?? gapMessage ?? pastProblem ?? endProblem ?? undefined;
  const statusText = [summary, viewerLine && !zoneAlert ? viewerLine : null, clash].filter(Boolean).join(" ");

  return (
    <FieldGroup
      legend={legend}
      hint={hint}
      error={groupError}
      disabled={disabled}
      describedBy={joinIds(pastWarning && warningId, clash && clashId)}
      className={className}
    >
      <div className="flex flex-col gap-3 min-[30rem]:flex-row min-[30rem]:items-start">
        <Field label="Date" className="shrink-0">
          <DatePicker
            size={size}
            defaultValue={defaultDate ?? null}
            today={toIso(todayIn(zone, new Date(now)))}
            onValueChange={(iso) => setDate(fromIso(iso))}
          />
        </Field>
        <Field label="Time" className="w-32 shrink-0">
          <TimeField size={size} defaultValue={time} now={utcToZoned(now, zone).time} onValueChange={setTime} />
        </Field>
        {zonePicker ? (
          <Field label="Time zone" className="min-w-48 flex-1">
            <Combobox
              size={size}
              options={zoneOptions}
              value={zone}
              onValueChange={(next) => {
                if (next) setZone(next);
              }}
              placeholder="Search time zones"
              noun={{ one: "time zone", other: "time zones" }}
            />
          </Field>
        ) : (
          <p className="m-0 self-end pb-2 text-sm text-muted min-[30rem]:pb-2.5">
            Times in {zoneShortName(zone, startsAtMs ?? now)}
          </p>
        )}
      </div>
      {withEndTime ? (
        showEnd ? (
          <Field label="End time" className="mt-3 w-32">
            <TimeField size={size} onValueChange={setEndTime} now={time ?? undefined} />
          </Field>
        ) : (
          <Button variant="link" leadingIcon={<Plus />} className="mt-2" onClick={() => setShowEnd(true)}>
            Add end time
          </Button>
        )
      ) : null}
      <p role="status" className={cn("m-0 mt-3 text-sm text-fg", !summary && "sr-only")}>
        {statusText}
      </p>
      {viewerLine && !zoneAlert ? <p className="m-0 mt-0.5 text-xs text-muted">{viewerLine}</p> : null}
      {pastWarning ? (
        <p id={warningId} className="m-0 mt-1 flex items-start gap-1 text-xs text-warning">
          <TriangleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
          {pastWarning}
        </p>
      ) : null}
      {zoneAlert && viewerZone && startsAtMs !== null ? (
        <InlineAlert tone="info" className="mt-3">
          {viewerLine} This time is in {zoneLongName(zone, startsAtMs)}, not your own zone.
        </InlineAlert>
      ) : null}
      {clash ? (
        <InlineAlert tone="warning" id={clashId} className="mt-3">
          {clash}
        </InlineAlert>
      ) : null}
      {name && value ? (
        <>
          <input type="hidden" name={`${name}_starts_at`} value={value.startsAt} />
          <input type="hidden" name={`${name}_timezone`} value={value.timezone} />
          {value.endsAt ? <input type="hidden" name={`${name}_ends_at`} value={value.endsAt} /> : null}
        </>
      ) : null}
    </FieldGroup>
  );
}

/** The zone list: the institution's zone, the viewer's and recent ones first, then every zone A to Z by city. */
function buildZoneOptions(orgZone: string, viewerZone: string | null, recentKey: string, labelAt: number): ComboboxOption[] {
  const recent = recentKey.split(",").filter(Boolean).map(canonicalZone);
  const suggested = [...new Set([canonicalZone(orgZone), ...(viewerZone ? [viewerZone] : []), ...recent])];
  const rest = listZones().filter((zone) => !suggested.includes(zone));
  return [
    ...suggested.map((zone) => ({ value: zone, label: zoneLabel(zone, labelAt), group: "Suggested" })),
    ...rest.map((zone) => ({ value: zone, label: zoneLabel(zone, labelAt), group: "All time zones" })),
  ];
}
