import { type OutputData } from "@editorjs/editorjs";
import * as Sentry from "@sentry/react";
import { z } from "zod";

const editorJsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.record(z.unknown()),
});

const editorJsOutputSchema = z.object({
  time: z.number().optional(),
  blocks: z.array(editorJsBlockSchema),
  version: z.string().optional(),
});

export function parseEditorJsOutput(value: string | null | undefined): OutputData | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const result = editorJsOutputSchema.safeParse(parsed);

    if (!result.success) {
      Sentry.captureException(new Error("Failed to parse EditorJS output"), {
        extra: { value, zodError: result.error.format() },
      });

      return null;
    }

    return result.data as OutputData;
  } catch (e) {
    Sentry.captureException(e, {
      extra: { value },
    });

    return null;
  }
}
