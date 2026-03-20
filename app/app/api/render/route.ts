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

  try {
    const formData = await req.formData();

    // Save uploaded files to temp directory
    const videoUrls: Record<string, string | null> = {
      destination1: null,
      destination2: null,
      destination3: null,
      destination4: null,
    };

    for (const key of Object.keys(videoUrls)) {
      const file = formData.get(key) as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(tmpDir, `${key}${getExtension(file.name)}`);
        fs.writeFileSync(filePath, buffer);
        videoUrls[key] = filePath;
      }
    }

    // Save music file
    let musicUrl: string | null = null;
    const musicFile = formData.get("music") as File | null;
    if (musicFile && musicFile.size > 0) {
      const buffer = Buffer.from(await musicFile.arrayBuffer());
      const musicPath = path.join(tmpDir, `music${getExtension(musicFile.name)}`);
      fs.writeFileSync(musicPath, buffer);
      musicUrl = musicPath;
    }

    // Parse scene texts
    const sceneTextsRaw = formData.get("sceneTexts") as string;
    const sceneTexts = JSON.parse(sceneTextsRaw);

    // Bundle the Remotion project
    const bundlePath = await bundle({
      entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: "PromotionalVideo",
      inputProps: {
        videos: videoUrls,
        musicUrl,
        sceneTexts,
      },
    });

    // Render to MP4
    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        videos: videoUrls,
        musicUrl,
        sceneTexts,
      },
    });

    // Read the rendered file and return it
    const videoBuffer = fs.readFileSync(outputPath);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="promotional-video.mp4"',
        "Content-Length": String(videoBuffer.length),
      },
    });
  } catch (error) {
    // Cleanup on error
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    console.error("Render error:", error);
    return NextResponse.json(
      { error: "Failed to render video", details: String(error) },
      { status: 500 }
    );
  }
}

function getExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext || ".mp4";
}
