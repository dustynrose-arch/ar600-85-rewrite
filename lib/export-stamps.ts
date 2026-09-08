export function wordHeaderMark(training: boolean): string {
  return training ? "TRAINING / DRAFT / WORKING COPY" : "DRAFT / WORKING COPY";
}

export function wordFooterMark(training: boolean): string {
  return training ? "TRAINING / DRAFT" : "DRAFT";
}
