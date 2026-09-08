import type { Role } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  editor: "Editor",
  reviewer: "Reviewer",
  approver: "Approver",
};

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function statusForError(error: unknown, fallback = 400): number {
  if (error instanceof ForbiddenError) return 403;
  return fallback;
}

export function canEdit(role: Role, locked: boolean): boolean {
  return role === "editor" && !locked;
}

export function canEditStructure(role: Role, locked: boolean): boolean {
  return role === "editor" && !locked;
}

export function canCreateOrCompleteTasks(role: Role, locked: boolean): boolean {
  return role === "editor" && !locked;
}

export function canSnapshot(role: Role, locked: boolean): boolean {
  return role === "editor" && !locked;
}

export function canMarkWgReview(role: Role): boolean {
  return role === "approver";
}

export function canUnlock(role: Role): boolean {
  return role === "editor" || role === "approver";
}

export function canUpload(role: Role): boolean {
  return role === "editor" || role === "approver";
}

export function canResetTraining(role: Role): boolean {
  return role === "editor" || role === "approver";
}

export function assertRole<T extends Role>(role: Role, allowed: T[], action: string): void {
  if (!allowed.includes(role as T)) {
    throw new Error(`${action} is gated to ${allowed.join(" / ")} (current role: ${role}).`);
  }
}
