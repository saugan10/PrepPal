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
    const systemPrompt = `You are an expert interview coach. Generate exactly 5 unique, relevant interview questions for a ${role} position${companyContext}.

Consider the following:
- Technical skills specific to the role
- Behavioral questions relevant to the position level
- Company-specific challenges if company is mentioned
- Industry best practices and current trends

Return a JSON array of exactly 5 questions that would realistically be asked in a professional interview setting.
Focus on questions that allow candidates to demonstrate their expertise and problem-solving abilities.
Each question should be distinct and cover different aspects of the role.

Format your response as a JSON array: ["question1", "question2", "question3", "question4", "question5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nNow generate interview questions for: ${role}${companyContext}`,
    });

    const rawText = response.text || "";
    console.log(`Gemini API Response for ${role}:`, { 
      status: 'success', 
      outputLength: rawText.length, 
      preview: rawText.substring(0, 200),
      fullResponse: rawText
    });
    
    // Try to parse JSON from the response
    let questions: string[] = [];
    try {
      // Look for JSON array in the response
      const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        // Fall back to parsing line-by-line
        questions = rawText
          .split(/\n/)
          .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
          .filter(line => line.length > 10 && line.includes('?'))
          .slice(0, 5);
      }
    } catch (parseError) {
      console.log(`JSON parse failed for ${role}, trying line parsing:`, parseError);
      questions = rawText
        .split(/\n/)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 10 && line.includes('?'))
        .slice(0, 5);
    }
    
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.slice(0, 5); // Ensure we only return 5 questions
    }
    
    throw new Error("Could not extract valid questions from Gemini API response");

  } catch (error) {
    console.error(`Failed to generate questions for ${role}:`, error);
    // Return fallback questions with role-specific variations
    return [
      `Tell me about your experience with ${role.toLowerCase()} responsibilities.`,
      `What interests you most about this ${role.toLowerCase()} position${company ? ` at ${company}` : ''}?`,
      `Describe a challenging project you've worked on recently in your ${role.toLowerCase()} role.`,
      `How do you stay updated with industry trends and best practices in ${role.toLowerCase()}?`,
      `What are your career goals in the next 2-3 years as a ${role.toLowerCase()}?`
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
      contents: `${systemPrompt}\n\n${userPrompt}`,
    });

    const rawText = response.text || "";
    console.log(`Gemini Feedback API Response:`, { 
      questionPreview: question.substring(0, 50), 
      answerPreview: answer.substring(0, 50),
      responseLength: rawText.length,
      responsePreview: rawText.substring(0, 200)
    });
    
    // Try to parse JSON from the response
    let feedback: InterviewFeedback;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.log("JSON parse failed for feedback, using fallback:", parseError);
      throw parseError;
    }
    
    // Validate the feedback response
    if (typeof feedback.clarity === 'number' && 
        typeof feedback.relevance === 'number' &&
        Array.isArray(feedback.suggestions) &&
        typeof feedback.overall === 'string') {
      
      // Ensure scores are within valid range
      feedback.clarity = Math.max(1, Math.min(5, Math.round(feedback.clarity)));
      feedback.relevance = Math.max(1, Math.min(5, Math.round(feedback.relevance)));
      
      return feedback;
    }
    
    throw new Error("Invalid feedback response format from AI model");
    
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
