import type { DateRange } from "react-day-picker";

/**
 * /orders хуудасны сонгосон өдөр (болон жагсаалтын горим)-ыг URL-ийн query-д
 * хадгалж, refresh / reload хийхэд сэргээхэд ашиглана:
 *
 *   /orders                                        → өнөөдөр (өгөгдмөл)
 *   /orders?date=2026-09-22                        → 2026-09-22 өдөр
 *   /orders?date=2026-09-22&to=2026-09-25&list=1   → жагсаалт, 09-22 … 09-25
 */
export type OrderQuery = {
  date?: string;
  to?: string;
  list?: string;
};

const DATE_PARAM = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" → тухайн өдрийн 00:00 (local) Date. Буруу/байхгүй бол undefined. */
export const parseDateParam = (value?: string | null): Date | undefined => {
  const match = DATE_PARAM.exec((value ?? "").trim());
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // 2026-02-31 гэх мэт байхгүй өдрийг (Date нь дараагийн сар руу гүйлгэдэг)
  // няцаана.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
};

/** URL-ээс ирсэн query-г FilterType-ийн `date` / `list` хэсэг болгоно. */
export const parseOrderQuery = (
  query?: OrderQuery,
): { date?: DateRange; list?: boolean } => {
  const from = parseDateParam(query?.date);
  if (!from) return {};

  if (query?.list !== "1") return { date: { from, to: from } };

  const to = parseDateParam(query?.to);
  return {
    date: { from, to: to && to.getTime() >= from.getTime() ? to : from },
    list: true,
  };
};

/**
 * Одоогийн `location.search`-ийг хэвээр хадгалаад date / to / list-ийг
 * шинэчилсэн search string (`?a=b` эсвэл "") буцаана.
 *
 * Өгөгдмөл төлөв (өдрийн горим + өнөөдөр)-д query бичихгүй — ингэснээр маргааш
 * нь хуудсыг refresh хийхэд өчигдрийн огноо "гацаж" үлдэхгүй.
 */
export const buildOrderSearch = (
  currentSearch: string,
  state: { date?: string; to?: string; list?: boolean },
  today: string,
): string => {
  const params = new URLSearchParams(currentSearch);
  params.delete("date");
  params.delete("to");
  params.delete("list");

  const isDefault = !state.list && (!state.date || state.date === today);
  if (!isDefault && state.date) {
    params.set("date", state.date);
    if (state.list) {
      params.set("list", "1");
      if (state.to && state.to !== state.date) params.set("to", state.to);
    }
  }

  const search = params.toString();
  return search ? `?${search}` : "";
};
