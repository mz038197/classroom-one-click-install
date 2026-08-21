import type { LessonSnippet } from "./courseCatalog";

export type CopyLessonSnippetResult =
  | { ok: true; title: string }
  | { ok: false };

/** Copy a Lesson Snippet body from the loaded catalog. Never echoes the body. */
export async function copyLessonSnippet(options: {
  snippetId: string;
  snippets: ReadonlyArray<Pick<LessonSnippet, "id" | "title" | "body">>;
  writeClipboard: (text: string) => Thenable<void>;
}): Promise<CopyLessonSnippetResult> {
  const snippet = options.snippets.find((row) => row.id === options.snippetId);
  if (!snippet) {
    return { ok: false };
  }
  try {
    await options.writeClipboard(snippet.body);
  } catch {
    return { ok: false };
  }
  return { ok: true, title: snippet.title };
}
