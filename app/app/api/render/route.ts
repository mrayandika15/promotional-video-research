import { NextRequest, NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout

export async function POST(req: NextRequest) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-render-"));
  const outputPath = path.join(tmpDir, "output.mp4");
  let bundlePath: string | null = null;

  try {
    const formData = await req.formData();

    // Save uploaded files to temp directory first
    const savedFiles: Record<string, string> = {};

    for (const key of ["destination1", "destination2", "destination3", "destination4"]) {
      const file = formData.get(key) as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${key}${getExtension(file.name)}`;
        const filePath = path.join(tmpDir, fileName);
        fs.writeFileSync(filePath, buffer);
        savedFiles[key] = fileName;
      }
    }

    // Save music file
    let musicFileName: string | null = null;
    const musicFile = formData.get("music") as File | null;
    if (musicFile && musicFile.size > 0) {
      const buffer = Buffer.from(await musicFile.arrayBuffer());
      musicFileName = `music${getExtension(musicFile.name)}`;
      fs.writeFileSync(path.join(tmpDir, musicFileName), buffer);
    }

    // Parse scene texts
    const sceneTextsRaw = formData.get("sceneTexts") as string;
    const sceneTexts = JSON.parse(sceneTextsRaw);

    // Bundle the Remotion project
    bundlePath = await bundle({
      entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
      webpackOverride: (config) => config,
      publicDir: null,
    });

    // Copy uploaded files INTO the bundle directory so Remotion's
    // HTTP server can serve them at /assets/<filename>
    const assetsDir = path.join(bundlePath, "assets");
    fs.mkdirSync(assetsDir, { recursive: true });

    for (const [key, fileName] of Object.entries(savedFiles)) {
      fs.copyFileSync(
        path.join(tmpDir, fileName),
        path.join(assetsDir, fileName)
      );
    }

    if (musicFileName) {
      fs.copyFileSync(
        path.join(tmpDir, musicFileName),
        path.join(assetsDir, musicFileName)
      );
    }

    // Build video URLs relative to the bundle (served via HTTP)
    const videoUrls: Record<string, string | null> = {
      destination1: savedFiles.destination1 ? `/assets/${savedFiles.destination1}` : null,
      destination2: savedFiles.destination2 ? `/assets/${savedFiles.destination2}` : null,
      destination3: savedFiles.destination3 ? `/assets/${savedFiles.destination3}` : null,
      destination4: savedFiles.destination4 ? `/assets/${savedFiles.destination4}` : null,
    };

    const musicUrl = musicFileName ? `/assets/${musicFileName}` : null;

    const inputProps = {
      videos: videoUrls,
      musicUrl,
      sceneTexts,
    };

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: "PromotionalVideo",
      inputProps,
    });

    // Render to MP4
    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
    });

    // Read the rendered file and return it
    const videoBuffer = fs.readFileSync(outputPath);

    // Cleanup
    cleanup(tmpDir, bundlePath);

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="promotional-video.mp4"',
        "Content-Length": String(videoBuffer.length),
      },
    });
  } catch (error) {
    cleanup(tmpDir, bundlePath);

    console.error("Render error:", error);
    return NextResponse.json(
      { error: "Failed to render video", details: String(error) },
      { status: 500 }
    );
  }
}

function cleanup(tmpDir: string, bundlePath: string | null) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  if (bundlePath) {
    try { fs.rmSync(bundlePath, { recursive: true, force: true }); } catch {}
  }
}

function getExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext || ".mp4";
}
