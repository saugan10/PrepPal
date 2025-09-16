import { GoogleGenAI } from "@google/genai";
import type { InterviewFeedback } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "" 
});

export async function generateInterviewQuestions(
  role: string, 
  company?: string
): Promise<string[]> {
  try {
    const companyContext = company ? ` at ${company}` : "";
    const prompt = `Generate 5 relevant interview questions for a ${role} position${companyContext}. 
    
    Consider the following:
    - Technical skills specific to the role
    - Behavioral questions relevant to the position level
    - Company-specific challenges if company is mentioned
    - Industry best practices and current trends
    
    Return questions that would realistically be asked in a professional interview setting.
    Focus on questions that allow candidates to demonstrate their expertise and problem-solving abilities.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const content = response.text || "";
    
    // Parse the response to extract individual questions
    const questions = content
      .split(/\d+\.|\n-|\n\*/)
      .map(q => q.trim())
      .filter(q => q.length > 10 && q.includes('?'))
      .slice(0, 5);

    return questions.length > 0 ? questions : [
      `Tell me about your experience with ${role.toLowerCase()} responsibilities.`,
      `What interests you most about this ${role.toLowerCase()} position?`,
      `Describe a challenging project you've worked on recently.`,
      `How do you stay updated with industry trends and best practices?`,
      `What are your career goals in the next 2-3 years?`
    ];
  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Return fallback questions
    return [
      `Tell me about your experience with ${role.toLowerCase()} responsibilities.`,
      `What interests you most about this ${role.toLowerCase()} position?`,
      `Describe a challenging project you've worked on recently.`,
      `How do you stay updated with industry trends and best practices?`,
      `What are your career goals in the next 2-3 years?`
    ];
  }
}

export async function provideFeedback(
  question: string,
  answer: string,
  role?: string
): Promise<InterviewFeedback> {
  try {
    const roleContext = role ? ` for a ${role} position` : "";
    const systemPrompt = `You are an expert interview coach providing constructive feedback on interview answers${roleContext}.

Analyze the candidate's answer and provide:
1. Clarity score (1-5): How well-structured and clear is the response?
2. Relevance score (1-5): How well does the answer address the question?
3. Specific improvement suggestions (2-3 actionable tips)
4. Overall feedback summary

Be encouraging but honest. Focus on specific improvements rather than general praise.

Respond with JSON in this exact format:
{
  "clarity": number,
  "relevance": number, 
  "suggestions": ["tip1", "tip2", "tip3"],
  "overall": "overall feedback summary"
}`;

    const userPrompt = `Question: "${question}"

Answer: "${answer}"

Please provide detailed feedback on this interview response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            clarity: { type: "number", minimum: 1, maximum: 5 },
            relevance: { type: "number", minimum: 1, maximum: 5 },
            suggestions: { 
              type: "array", 
              items: { type: "string" },
              minItems: 1,
              maxItems: 4
            },
            overall: { type: "string" }
          },
          required: ["clarity", "relevance", "suggestions", "overall"]
        }
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const feedback: InterviewFeedback = JSON.parse(rawJson);
      
      // Validate the response
      if (typeof feedback.clarity === 'number' && 
          typeof feedback.relevance === 'number' &&
          Array.isArray(feedback.suggestions) &&
          typeof feedback.overall === 'string') {
        
        // Ensure scores are within valid range
        feedback.clarity = Math.max(1, Math.min(5, Math.round(feedback.clarity)));
        feedback.relevance = Math.max(1, Math.min(5, Math.round(feedback.relevance)));
        
        return feedback;
      }
    }
    
    throw new Error("Invalid response format from AI model");
    
  } catch (error) {
    console.error("Failed to provide feedback:", error);
    
    // Return fallback feedback based on answer length and content
    const answerLength = answer.trim().length;
    const clarity = answerLength > 100 ? 3 : answerLength > 50 ? 2 : 1;
    const relevance = answer.toLowerCase().includes(question.toLowerCase().split(' ')[0]) ? 3 : 2;
    
    return {
      clarity: Math.max(1, Math.min(5, clarity)),
      relevance: Math.max(1, Math.min(5, relevance)),
      suggestions: [
        answerLength < 50 ? "Try to provide more detailed examples in your answer" : "Good level of detail",
        "Consider using the STAR method (Situation, Task, Action, Result) for behavioral questions",
        "Connect your answer back to the specific requirements of the role"
      ].filter(s => s !== "Good level of detail" || answerLength >= 50),
      overall: answerLength < 50 
        ? "Your answer could benefit from more detail and specific examples. Try to elaborate on your experience and provide concrete instances."
        : "Good foundation for an answer. Consider adding more specific examples and connecting your response directly to the role requirements."
    };
  }
}
