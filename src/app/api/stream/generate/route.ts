import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
const Schema = z.object({ storyId: z.string(), chapterId: z.string(), format: z.enum(["FLASH","STANDARD","EPIC"]), creativity: z.number().min(0).max(100).default(70), userPrompt: z.string().min(10).max(500), contentMode: z.enum(["SAFE","UNCENSORED"]).default("SAFE") });
const WORD_TARGETS = { FLASH: 500, STANDARD: 1500, EPIC: 3000 };
function sparksForWords(w: number) { return Math.ceil(w / 100); }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  let body: z.infer<typeof Schema>;
  try { body = Schema.parse(await req.json()); } catch (e) { return new Response(JSON.stringify({ error: "Invalid request" }), { status: 422 }); }
  const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } });
  const estimatedCost = sparksForWords(WORD_TARGETS[body.format]);
  if (!wallet || wallet.balanceSparks < estimatedCost) {
    return new Response(JSON.stringify({ error: "INSUFFICIENT_SPARKS", required: estimatedCost, available: wallet?.balanceSparks ?? 0 }), { status: 402 });
  }
  const encoder = new TextEncoder();
  let accumulated = "";
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
        send("status", { type: "generation_start" });
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: WORD_TARGETS[body.format] * 2,
          temperature: body.creativity / 100,
          system: `You are VibeScribe, a master storyteller. Write a ${body.format.toLowerCase()} story (~${WORD_TARGETS[body.format]} words). Use vivid sensory detail, compelling dialogue, and cinematic pacing. Begin immediately — no preamble.`,
          messages: [{ role: "user", content: body.userPrompt }],
        });
        claudeStream.on("text", delta => { accumulated += delta; send("token", { delta }); });
        claudeStream.on("message", async () => {
          const wordCount = accumulated.trim().split(/\s+/).filter(Boolean).length;
          const actualCost = sparksForWords(wordCount);
          await db.wallet.update({ where: { userId: session.user.id }, data: { balanceSparks: { decrement: actualCost } } });
          await db.chapter.update({ where: { id: body.chapterId }, data: { rawText: accumulated, wordCount, sparksCost: actualCost, status: "AUDIO_PENDING" } });
          send("generation_complete", { chapterId: body.chapterId, wordCount, sparksCost: actualCost });
          controller.close();
        });
        claudeStream.on("error", err => { send("error", { message: err.message }); controller.close(); });
        await claudeStream.finalMessage();
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`));
        controller.close();
      }
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}