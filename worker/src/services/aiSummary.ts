import OpenAI from 'openai';

const apiKey = process.env.GROQ_API_KEY;

let client: OpenAI | null = null;
if (apiKey) {
  client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

export async function generateFailureSummary(
  jobName: string,
  errorMessage: string,
  errorStack: string | undefined,
  attempts: number
): Promise<string | null> {
  if (!client) {
    console.warn('[worker][ai] GROQ_API_KEY not set, skipping AI summary');
    return null;
  }

  try {
    const prompt = `A background job named "${jobName}" failed permanently after ${attempts} attempts and was moved to a dead letter queue.

Error message: ${errorMessage}
Stack trace: ${errorStack || 'not available'}

In 2-3 plain-English sentences, summarize what likely went wrong and suggest one concrete next step for a developer investigating this. Be concise and non-technical where possible.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error('[worker][ai] failed to generate summary:', err);
    return null;
  }
}
