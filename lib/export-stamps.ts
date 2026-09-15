export function wordHeaderMark(training: boolean): string {
  return training ? "TRAINING / DRAFT / WORKING COPY" : "DRAFT / WORKING COPY";
}

export function wordFooterMark(training: boolean): string {
  return training ? "TRAINING / DRAFT" : "DRAFT";
}

export const TRACK_CHANGES_COVER_LINE = "change-markup working draft for WG review";

export const TRACK_CHANGES_AUTHOR = "AR 600-85 Rewrite WG";
