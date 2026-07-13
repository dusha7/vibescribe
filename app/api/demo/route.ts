export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body ?? {};

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = 'You are a brilliant fiction writer. Write a short, captivating story in English (max 500 words). Make it vivid, engaging, and complete with a satisfying ending.';
    const userPrompt = `Write a short story based on this idea: ${prompt}\n\nStart with a compelling title on the first line (just the title, no prefix), then a blank line, then the story. Keep it under 500 words.`;

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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!llmResponse?.ok) {
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

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
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed?.type !== 'content_block_delta') continue;
                    const content = parsed?.delta?.text ?? '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Demo stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Demo error:', error);
    return NextResponse.json({ error: 'Demo generation failed' }, { status: 500 });
  }
}
