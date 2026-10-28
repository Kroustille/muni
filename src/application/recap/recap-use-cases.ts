import { buildRecapSnapshot } from "@/application/recap/build-recap-snapshot";
import type { RecapPeriod, RecapActivityViewportWindow } from "@/domain/recap";
import type { RecapDeps } from "@/application/recap/contributor-types";
import {
  navigatePeriod as navigateRecapPeriod,
  setPeriodGranularity as setRecapPeriodGranularity,
} from "@/application/recap/period";

export type RecapBuildSnapshotOptions = {
  activityViewportWindow?: RecapActivityViewportWindow;
};

export type RecapUseCases = {
  buildSnapshot(
    period: RecapPeriod,
    options?: RecapBuildSnapshotOptions,
  ): ReturnType<typeof buildRecapSnapshot>;
  navigatePeriod(period: RecapPeriod, direction: "prev" | "next"): RecapPeriod;
  setPeriodGranularity(
    anchorDate: string,
    granularity: RecapPeriod["granularity"],
    timeZone?: string,
  ): RecapPeriod;
};

export function createRecapUseCases(deps: RecapDeps): RecapUseCases {
  return {
    buildSnapshot(period, options) {
      return buildRecapSnapshot({ period, deps, ...options });
    },
    navigatePeriod(period, direction) {
      return navigateRecapPeriod(period, direction);
    },
    setPeriodGranularity(anchorDate, granularity, timeZone) {
      return setRecapPeriodGranularity(anchorDate, granularity, timeZone);
    },
  };
}
