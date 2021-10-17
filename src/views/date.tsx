import React, { Fragment } from "react";

const timeZone = "America/Edmonton";

const fullFormat = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  year: "numeric",
  // era: 'short',
  month: "2-digit",
  day: "2-digit",
  hour12: true,
  hour: "numeric",
  minute: "2-digit",
  // second: "2-digit",
  timeZone,
});

const pastDayFormat = new Intl.DateTimeFormat("en-CA", {
  hour12: true,
  hour: "numeric",
  minute: "2-digit",
  timeZone,
});

const pastWeekFormat = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  hour: "numeric",
  timeZone,
});

const pastMonthsFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone,
});

const olderThanAYearFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone,
});

const longFormat = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour12: true,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZone,
  timeZoneName: "long",
});

export function DateView({
  date,
  abbreviate = false,
}: {
  date?: Date;
  abbreviate?: boolean;
}) {
  if (date === undefined) {
    return <Fragment />;
  }

  let format = fullFormat;

  if (abbreviate) {
    const now = new Date().getTime();
    const then = date.getTime();

    const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

    if (now - then < ONE_DAY_IN_MS) {
      format = pastDayFormat;
    } else if (now - then < ONE_DAY_IN_MS * 7) {
      format = pastWeekFormat;
    } else if (now - then < ONE_DAY_IN_MS * 30 * 9) {
      format = pastMonthsFormat;
    } else {
      format = olderThanAYearFormat;
    }
  }

  const formatted = format.format(date).replace(".,", "");
  const tooltip = date.toISOString() + "\n" + longFormat.format(date);
  return (
    <span className="data" title={tooltip}>
      {formatted}
    </span>
  );
}
