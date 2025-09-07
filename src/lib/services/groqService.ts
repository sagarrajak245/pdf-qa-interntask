// lib/services/groqService.ts
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class GroqService {
    async generateResponse(
        question: string,
        context: string,
        chatHistory: ChatMessage[] = []
    ): Promise<string> {
        try {
            const systemPrompt = `You are a helpful assistant that answers questions based on the provided context from PDF documents. 
      
Guidelines:
- Answer questions based ONLY on the provided context
- If the answer is not in the context, say "I don't have enough information in the provided documents to answer this question."
- Be concise but comprehensive
- If referencing specific information, mention it's from the documents
- Maintain a helpful and professional tone

Context from documents:
${context}`;

            const messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...chatHistory.slice(-10), // Keep last 10 messages for context
                { role: 'user', content: question }
            ];

            const completion = await groq.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                max_tokens: 1024,
                top_p: 1,
                stream: false,
            });

            return completion.choices[0]?.message?.content || 'No response generated';
        } catch (error) {
            console.error('Groq API error:', error);
            throw new Error('Failed to generate response from Groq API');
        }
    }

    async generateTitle(firstMessage: string): Promise<string> {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'Generate a short, descriptive title (max 6 words) for this chat based on the user\'s first question. Return only the title, nothing else.'
                    },
                    {
                        role: 'user',
                        content: firstMessage
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 50,
            });

            return completion.choices[0]?.message?.content?.trim() || 'New Chat';
        } catch (error) {
            console.error('Error generating title:', error);
            return 'New Chat';
        }
    }
}

export const groqService = new GroqService();