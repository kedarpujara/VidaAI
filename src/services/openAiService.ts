import Constants from 'expo-constants';
import { generateEntriesHash, getCachedSummary, setCachedSummary, WEEKLY_CACHE_KEY, MONTHLY_CACHE_KEY } from './cacheService';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export const generateOpenAISummary = async (
  entries: any[],
  period: 'week' | 'month',
  startDate?: Date,
  endDate?: Date,
  cacheId?: string
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (entries.length === 0) {
    return `No entries found for this ${period}.`;
  }

  // Generate cache key and entries hash
  const cacheKey = period === 'week' ? WEEKLY_CACHE_KEY : MONTHLY_CACHE_KEY;
  const entriesHash = generateEntriesHash(entries);
  const id = cacheId || `${period}_${startDate?.toISOString().split('T')[0] || 'current'}`;

  // Try to get cached summary first
  const cachedSummary = await getCachedSummary(cacheKey, id, entriesHash);
  if (cachedSummary) {
    console.log(`Using cached ${period} summary for ${id}`);
    return cachedSummary;
  }

  console.log(`Generating new ${period} summary for ${id} (cache miss)`);

  // Prepare data for analysis
  const entryTexts = entries.map(entry => entry.text || entry.content || '').join('\n\n');
  const allTags = entries.flatMap(entry => entry.tags || []);
  const emotions = entries.flatMap(entry => entry.emotions || []);
  const moods = entries.map(entry => entry.mood?.score || 7);
  const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;

  const tagFrequency = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  const dateRange = period === 'week'
    ? `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`
    : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

  const prompt = `
You are an expert journal analyst. Analyze the following ${period}ly journal entries and provide a thoughtful, insightful summary.

${period.charAt(0).toUpperCase() + period.slice(1)} Period: ${dateRange}
Number of entries: ${entries.length}
Average mood (1-10): ${avgMood.toFixed(1)}
Top themes/tags: ${topTags.join(', ')}

Journal Entries:
${entryTexts}

Please provide a comprehensive ${period}ly summary in exactly this JSON format:
{
  "overallTone": "brief description of emotional tone",
  "keyHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "challengesOrLowlights": ["challenge 1", "challenge 2"],
  "patterns": "description of recurring patterns or themes",
  "growth": "insights about personal growth or changes",
  "summary": "a thoughtful 2-3 sentence summary of the ${period}"
}

Focus on:
- Emotional patterns and mood trends
- Recurring themes and personal growth
- Significant moments (both positive and challenging)
- Insights about behavior, relationships, or mindset
- Actionable observations

Return only valid JSON, no additional text.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional journal analyst specializing in emotional intelligence and personal growth insights. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI');
    }

    // Clean and parse the JSON response
    const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    const summary = analysis.summary || `Insightful ${period} of journaling with ${entries.length} entries.`;

    // Cache the summary
    await setCachedSummary(cacheKey, id, summary, entriesHash);

    return summary;
  } catch (error) {
    console.error('OpenAI summary failed:', error);
    const fallbackSummary = `This ${period} included ${entries.length} journal entries with an average mood of ${avgMood.toFixed(1)}/10. Key themes: ${topTags.slice(0, 3).join(', ')}.`;

    // Cache the fallback summary too (shorter expiry)
    await setCachedSummary(cacheKey, id, fallbackSummary, entriesHash);

    return fallbackSummary;
  }
};