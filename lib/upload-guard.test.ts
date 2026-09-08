import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_UPLOAD_BYTES } from "./types.ts";
import {
  REJECT_LEGACY_TYPE,
  REJECT_OVER_SIZE,
  REJECT_WRONG_TYPE,
  isAllowedUploadName,
  rejectUploadReason,
  uploadExtension,
} from "./upload-guard.ts";

test("allowlists modern .docx .pdf .pptx only", () => {
  assert.equal(isAllowedUploadName("policy.docx"), true);
  assert.equal(isAllowedUploadName("brief.PPTX"), true);
  assert.equal(isAllowedUploadName("scan.PDF"), true);
  assert.equal(isAllowedUploadName("legacy.doc"), false);
  assert.equal(isAllowedUploadName("legacy.ppt"), false);
  assert.equal(isAllowedUploadName("notes.txt"), false);
  assert.equal(uploadExtension("AR600-85-training.DOCX"), ".docx");
});

test("rejects legacy type, wrong type, and oversize with locked messages", () => {
  assert.equal(rejectUploadReason({ name: "old.doc", size: 100 }), REJECT_LEGACY_TYPE);
  assert.equal(rejectUploadReason({ name: "old.ppt", size: 100 }), REJECT_LEGACY_TYPE);
  assert.equal(rejectUploadReason({ name: "notes.txt", size: 100 }), REJECT_WRONG_TYPE);
  assert.equal(rejectUploadReason({ name: "big.pdf", size: MAX_UPLOAD_BYTES + 1 }), REJECT_OVER_SIZE);
  assert.equal(rejectUploadReason({ name: "ok.docx", size: MAX_UPLOAD_BYTES }), null);
});
