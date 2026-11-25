import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAuthenticatedStaffProfile } from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const BUCKET = "kaggadu-media";
const ALLOWED_FOLDERS = [
  "logo",
  "treks",
  "trips",
  "camping",
  "kids",
  "volunteers",
  "leaders",
  "general",
];

function getLocalFolderDir(folder: string): string {
  return path.join(process.cwd(), "public", "uploads", folder);
}

export async function GET(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || "general";
  const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : "general";

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const dir = getLocalFolderDir(safeFolder);
    if (!fs.existsSync(dir)) return NextResponse.json({ items: [] });
    const files = fs.readdirSync(dir);
    return NextResponse.json({
      items: files.map((name) => ({
        name,
        path: `${safeFolder}/${name}`,
        publicUrl: `/uploads/${safeFolder}/${name}`,
      })),
    });
  }

  const { data, error } = await supabase.storage.from(BUCKET).list(safeFolder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const filePath = `${safeFolder}/${f.name}`;
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return { name: f.name, path: filePath, publicUrl };
    });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "general");
  const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : "general";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `${safeFolder}/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const dir = getLocalFolderDir(safeFolder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safeName), buffer);
    return NextResponse.json(
      { path: filePath, publicUrl: `/uploads/${filePath}` },
      { status: 201 }
    );
  }

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ path: filePath, publicUrl }, { status: 201 });
}

export async function DELETE(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("path");
  if (!targetPath) return NextResponse.json({ error: "File path is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const safeResolved = path.resolve(process.cwd(), "public", "uploads", targetPath);
    const baseUploads = path.resolve(process.cwd(), "public", "uploads");
    if (!safeResolved.startsWith(baseUploads)) {
      return NextResponse.json({ error: "Invalid path." }, { status: 400 });
    }
    if (fs.existsSync(safeResolved)) fs.unlinkSync(safeResolved);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.storage.from(BUCKET).remove([targetPath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
