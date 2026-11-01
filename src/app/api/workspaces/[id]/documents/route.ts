import { loadEnv } from "@/core/env";
import { ingestUpload, MAX_UPLOAD_BYTES, UploadError } from "@/core/ingest/upload";
import { openStore } from "@/core/store/open";

const STATUS: Record<UploadError["code"], number> = {
  too_large: 413,
  bad_type: 415,
  bad_name: 400,
  no_text: 422,
  not_utf8: 415,
  unknown_workspace: 404,
  read_only_workspace: 403,
};

const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status });

/** POST multipart/form-data with one "file" field: PDF, Markdown or .txt, up to 20 MB. */
export async function POST(request: Request, ctx: RouteContext<"/api/workspaces/[id]/documents">) {
  const { id } = await ctx.params;
  // A size header is required, so the body can be refused before it is read.
  const header = request.headers.get("content-length");
  const length = header === null ? NaN : Number(header);
  if (!Number.isFinite(length)) return fail(411, "length_required", "Send a Content-Length header.");
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, "too_large", "Files can be up to 20 MB.");
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail(400, "bad_request", 'Send multipart/form-data with a "file" field.');
  }
  if (!(file instanceof File)) return fail(400, "bad_request", 'Send multipart/form-data with a "file" field.');
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "too_large", "Files can be up to 20 MB.");

  const store = openStore(loadEnv(process.env).dataDir);
  try {
    const r = await ingestUpload(store, id, file.name, new Uint8Array(await file.arrayBuffer()));
    return Response.json(r, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return fail(STATUS[e.code], e.code, e.message);
    throw e;
  } finally {
    store.close();
  }
}
