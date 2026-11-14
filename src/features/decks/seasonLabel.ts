import type { Locale, SeasonWindow } from "../../content/types";
import { formatCopy } from "../../i18n/localize";

interface SeasonTemplates {
  seasonSameMonth: string;
  seasonCrossMonth: string;
}

const intlLocales: Record<Locale, string> = { en: "en-GB", pt: "pt-PT" };

/** Reads "MM-DD" into a month index (0 to 11) and a day number. */
const parseMonthDay = (monthDay: string) => {
  const [month = "1", day = "1"] = monthDay.split("-");
  return { monthIndex: Number(month) - 1, day: Number(day) };
};

/** "In season 1 to 30 June", or with both months when the window spans two. */
export const formatSeasonWindow = (
  season: SeasonWindow,
  locale: Locale,
  templates: SeasonTemplates
): string => {
  const monthFormatter = new Intl.DateTimeFormat(intlLocales[locale], {
    month: "long",
    timeZone: "UTC",
  });
  // Any year works: only the month name is read.
  const monthName = (monthIndex: number) =>
    monthFormatter.format(new Date(Date.UTC(2026, monthIndex, 1)));
  const start = parseMonthDay(season.start);
  const end = parseMonthDay(season.end);

  if (start.monthIndex === end.monthIndex) {
    return formatCopy(templates.seasonSameMonth, {
      startDay: start.day,
      endDay: end.day,
      month: monthName(start.monthIndex),
    });
  }
  return formatCopy(templates.seasonCrossMonth, {
    startDay: start.day,
    startMonth: monthName(start.monthIndex),
    endDay: end.day,
    endMonth: monthName(end.monthIndex),
  });
};
