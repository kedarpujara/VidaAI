const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface AIAnalysisResult {
    title: string;               // NEW: AI-generated title
    mood: {
        primary: string;
        secondary?: string;
        intensity: number;
        confidence: number;
    };
    emotions: string[];
    themes: string[];
    insights: {
        keyTopics: string[];
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        energy: 'high' | 'medium' | 'low';
        clarity: number;
    };
}

class AIAnalysisService {
    static async analyzeJournalEntry(text: string): Promise<AIAnalysisResult> {
        try {
            if (!OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured');
            }

            console.log('Starting AI analysis with title generation...');

            const prompt = `Analyze this journal entry and provide insights with a title in JSON format:

"${text}"

Respond with ONLY a JSON object:
{
    "title": "A concise, engaging 3-6 word title that captures the essence of this entry",
    "mood": {
    "primary": "happy/sad/anxious/grateful/excited/frustrated/peaceful/etc",
    "secondary": "optional secondary mood",
    "intensity": 5,
    "confidence": 0.8
    },
    "emotions": ["joy", "anticipation"],
    "themes": ["work", "family", "health"],
    "insights": {
    "keyTopics": ["specific", "topics", "mentioned"],
    "sentiment": "positive/negative/neutral/mixed",
    "energy": "high/medium/low",
    "clarity": 8
    }
}

Title Guidelines:
- Keep it 3-6 words max
- Capture the main theme or emotion
- Make it engaging and personal
- Examples: "Exciting New Job Opportunity", "Peaceful Morning Reflection", "Family Dinner Stress", "Grateful Weekend Moments"`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert at analyzing emotions, themes, and creating engaging titles for journal entries. Always respond with valid JSON only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 400,
                    temperature: 0.4, // Slightly higher for more creative titles
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();
            const analysisText = result.choices[0]?.message?.content?.trim();

            if (!analysisText) {
                throw new Error('No analysis returned');
            }

            const analysis = JSON.parse(analysisText);
            console.log('AI analysis with title completed successfully');
            return analysis;

        } catch (error) {
            console.error('AI analysis failed:', error);

            // Return fallback analysis with simple title
            return {
                title: this.generateSimpleTitle(text),
                mood: {
                    primary: this.extractSimpleMood(text),
                    intensity: 5,
                    confidence: 0.3
                },
                emotions: this.extractSimpleEmotions(text),
                themes: this.extractSimpleThemes(text),
                insights: {
                    keyTopics: text.split(' ').slice(0, 3),
                    sentiment: 'neutral',
                    energy: 'medium',
                    clarity: 7
                }
            };
        }
    }

    // NEW: Generate simple title from first few words
    private static generateSimpleTitle(text: string): string {
        const words = text.trim().split(' ').slice(0, 4);
        const title = words.join(' ');

        // Add ellipsis if the original text is longer
        if (text.split(' ').length > 4) {
            return title + '...';
        }

        return title || 'Journal Entry';
    }

    private static extractSimpleMood(text: string): string {
        const moodKeywords = {
            'happy': ['happy', 'joy', 'excited', 'great', 'amazing'],
            'sad': ['sad', 'down', 'upset', 'disappointed'],
            'anxious': ['anxious', 'worried', 'nervous', 'stressed'],
            'grateful': ['grateful', 'thankful', 'blessed'],
            'frustrated': ['frustrated', 'annoyed', 'angry']
        };

        const lowercaseText = text.toLowerCase();
        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            if (keywords.some(keyword => lowercaseText.includes(keyword))) {
                return mood;
            }
        }
        return 'neutral';
    }

    private static extractSimpleEmotions(text: string): string[] {
        const emotions = ['happy', 'sad', 'excited', 'nervous', 'grateful'];
        const lowercaseText = text.toLowerCase();
        return emotions.filter(emotion => lowercaseText.includes(emotion)).slice(0, 3);
    }

    private static extractSimpleThemes(text: string): string[] {
        const themes = {
            'work': ['work', 'job', 'office', 'meeting'],
            'family': ['family', 'mom', 'dad', 'parent'],
            'health': ['health', 'exercise', 'doctor'],
            'relationships': ['friend', 'partner', 'relationship']
        };

        const lowercaseText = text.toLowerCase();
        const detected: string[] = [];

        for (const [theme, keywords] of Object.entries(themes)) {
            if (keywords.some(keyword => lowercaseText.includes(keyword))) {
                detected.push(theme);
            }
        }

        return detected.slice(0, 3);
    }
}

export default AIAnalysisService;