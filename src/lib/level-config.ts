import {
  CUSTOMER_USER_LEVELS,
  EMPLOYEE_USER_LEVELS,
  getUserLevelValue,
} from "@/lib/constants";
import { UserLevel } from "@/lib/enum";

export type LevelConfigItem = {
  name: string;
  threshold?: number;
};

export type LevelConfig = {
  customer: Partial<Record<UserLevel, LevelConfigItem>>;
  employee: Partial<Record<UserLevel, LevelConfigItem>>;
};

const defaultCustomerThresholds = {
  [UserLevel.BRONZE]: 10,
  [UserLevel.SILVER]: 20,
  [UserLevel.GOLD]: 30,
} as Partial<Record<UserLevel, number>>;

const normalizeItem = (
  value: unknown,
  level: UserLevel,
  includeThreshold: boolean,
): LevelConfigItem => {
  const raw = value && typeof value === "object" ? (value as any) : undefined;
  const fallbackName = getUserLevelValue[level]?.name ?? String(level);
  const fallbackThreshold = defaultCustomerThresholds[level] ?? 0;

  return {
    name: String(raw?.name ?? fallbackName),
    ...(includeThreshold
      ? {
          threshold: Number(
            raw?.threshold ?? raw?.value ?? value ?? fallbackThreshold,
          ),
        }
      : {}),
  };
};

export const normalizeLevelConfig = (value: any): LevelConfig => ({
  customer: CUSTOMER_USER_LEVELS.reduce(
    (acc, level) => {
      acc[level] = normalizeItem(
        value?.customer?.[level] ?? value?.[level],
        level,
        true,
      );
      return acc;
    },
    {} as Partial<Record<UserLevel, LevelConfigItem>>,
  ),
  employee: EMPLOYEE_USER_LEVELS.reduce(
    (acc, level) => {
      acc[level] = normalizeItem(value?.employee?.[level], level, false);
      return acc;
    },
    {} as Partial<Record<UserLevel, LevelConfigItem>>,
  ),
});

export const getLevelName = (
  config: LevelConfig,
  group: keyof LevelConfig,
  level?: number | null,
) => {
  if (level === undefined || level === null) return "-";
  return (
    config[group]?.[level as UserLevel]?.name ??
    getUserLevelValue[level as UserLevel]?.name ??
    "-"
  );
};
