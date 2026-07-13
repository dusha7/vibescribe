export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { INK_COSTS } from '@/lib/types';

const FORMAT_WORDS: Record<string, number> = {
  short: 500,
  standard: 1500,
  long: 3000,
  series: 2000,
};

const GENRE_NAMES: Record<string, string> = {
  fantasy: 'fantasy', scifi: 'science fiction', horror: 'horror', romance: 'romance',
  adventure: 'adventure', detective: 'detective mystery', 'dark-romance': 'dark romance',
  romantasy: 'romantasy (romantic fantasy)', cyberpunk: 'cyberpunk', 'fairy-tale': 'fairy tale',
  dystopian: 'dystopian fiction', thriller: 'psychological thriller', custom: '',
};

const STYLE_NAMES: Record<string, string> = {
  light: 'light and easy to read', literary: 'literary and polished',
  epic: 'epic and grand', dark: 'dark and gritty',
};

const AGE_INSTRUCTIONS: Record<string, string> = {
  children: 'Write for children aged 6-12. Keep language simple, themes positive, no violence or scary content.',
  teens: 'Write for young adults 13-17. Engaging themes, moderate complexity, no explicit content.',
  adults: 'Write for adult readers. Full creative freedom with complex themes and sophisticated prose.',
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, genre, tropes, creativity, prompt, ageRating, style, protagonist, setting, conflict, characterId, continueStoryId } = body ?? {};

    if (!format || !genre) {
      return NextResponse.json({ error: 'Format and genre are required' }, { status: 400 });
    }

    const inksCost = continueStoryId ? INK_COSTS.continue : (INK_COSTS.generate as any)[format] ?? 5;
    const wordCount = FORMAT_WORDS[format] ?? 500;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { inks: true },
    });

    if (!user || (user?.inks ?? 0) < inksCost) {
      return NextResponse.json(
        { error: `Not enough Inks. Need: ${inksCost}, available: ${user?.inks ?? 0}` },
        { status: 402 }
      );
    }

    // Build prompt
    const genreName = GENRE_NAMES[genre] ?? genre;
    const tropesList = (tropes ?? []).join(', ');
    const styleName = STYLE_NAMES[style ?? 'literary'] ?? 'literary';
    const ageInstruction = AGE_INSTRUCTIONS[ageRating ?? 'adults'] ?? AGE_INSTRUCTIONS.adults;

    let systemPrompt = `You are a brilliant, bestselling fiction writer. Write captivating, immersive stories in English. Style: ${styleName}. ${ageInstruction} Target: ~${wordCount} words.`;

    // Load character if provided
    let characterContext = '';
    if (characterId) {
      const char = await prisma.character.findUnique({ where: { id: characterId } });
      if (char && char.userId === session.user.id) {
        characterContext = `\nMain character: ${char.name}.`;
        if (char.age) characterContext += ` Age: ${char.age}.`;
        if (char.appearance) characterContext += ` Appearance: ${char.appearance}.`;
        if (char.profession) characterContext += ` Profession: ${char.profession}.`;
        if (char.traits) characterContext += ` Personality: ${char.traits}.`;
        if (char.backstory) characterContext += ` Backstory: ${char.backstory}.`;
      }
    }

    let userPrompt = '';

    // Handle story continuation
    if (continueStoryId) {
      const prevStory = await prisma.story.findUnique({ where: { id: continueStoryId } });
      if (prevStory && prevStory.userId === session.user.id) {
        const lastPart = (prevStory.content ?? '').slice(-3000);
        userPrompt = `Continue this story naturally. Here is the story so far (last part):\n\n"""\n${lastPart}\n"""\n\nWrite the next chapter (~${wordCount} words). Maintain the same tone, characters, and plot direction. Start directly with the next part of the story (no title needed).`;
      }
    }

    if (!userPrompt) {
      userPrompt = `Write a ${genreName} story.`;
      if (tropesList) userPrompt += ` Include tropes: ${tropesList}.`;
      if (protagonist) userPrompt += ` Protagonist: ${protagonist}.`;
      if (setting) userPrompt += ` Setting: ${setting}.`;
      if (conflict) userPrompt += ` Central conflict: ${conflict}.`;
      userPrompt += characterContext;
      if (prompt) userPrompt += ` Premise: ${prompt}`;
      userPrompt += `\n\nStart with a compelling title on the first line, then a blank line, then the story. ~${wordCount} words.`;
    }

    // Deduct inks
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { inks: { decrement: inksCost } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          amount: -inksCost,
          type: 'SPEND',
          description: continueStoryId ? 'Story continuation' : `Story generation (${genreName})`,
        },
      }),
    ]);

    const llmResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        max_tokens: Math.max(wordCount * 3, 2000),
        temperature: creativity ?? 0.7,
      }),
    });

    if (!llmResponse?.ok) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: session.user.id }, data: { inks: { increment: inksCost } } }),
        prisma.transaction.create({ data: { userId: session.user.id, amount: inksCost, type: 'PURCHASE', description: 'Refund for generation error' } }),
      ]);
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

    const userId = session.user.id;
    let fullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let partialRead = '';

        try {
          while (true) {
            const result = await reader?.read();
            if (!result || result?.done) break;
            partialRead += decoder.decode(result.value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';

            for (const line of lines) {
              if (line?.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]' || data.includes('"type":"message_stop"')) {
                  try {
                    let title = 'Untitled';
                    let storyContent = fullContent;
                    if (!continueStoryId) {
                      const titleMatch = fullContent?.match(/^(.+?)\n/);
                      title = titleMatch?.[1]?.trim() ?? 'Untitled';
                      storyContent = fullContent?.replace(/^.+?\n+/, '')?.trim() ?? fullContent;
                    }

                    if (continueStoryId) {
                      // Append to existing story
                      const prevStory = await prisma.story.findUnique({ where: { id: continueStoryId } });
                      if (prevStory) {
                        await prisma.story.update({
                          where: { id: continueStoryId },
                          data: { content: prevStory.content + '\n\n---\n\n' + fullContent.trim() },
                        });
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', storyId: continueStoryId, title: prevStory.title, inksCost })}\n\n`));
                      }
                    } else {
                      const story = await prisma.story.create({
                        data: {
                          userId, title, content: storyContent, genre, format,
                          prompt: prompt ?? null, tropes: (tropes ?? []).join(',') || null,
                          ageRating: ageRating ?? 'adults', style: style ?? 'literary',
                          protagonist: protagonist ?? null, setting: setting ?? null, conflict: conflict ?? null,
                        },
                      });
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', storyId: story?.id, title, inksCost })}\n\n`));
                    }
                  } catch (saveErr) {
                    console.error('Save error:', saveErr);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', title: 'Untitled', inksCost })}\n\n`));
                  }
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed?.type !== 'content_block_delta') continue;
                    const content = parsed?.delta?.text ?? '';
                  if (content) {
                    fullContent += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Story generation failed' }, { status: 500 });
  }
}
