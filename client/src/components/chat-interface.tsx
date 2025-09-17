import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Zap, CheckCircle2 } from "lucide-react";
import type { ChatMessage, InterviewFeedback, QuestionWithAnswer } from "@shared/schema";

interface ChatInterfaceProps {
  applicationId?: string;
  role: string;
  company?: string;
  onSessionComplete?: (questions: QuestionWithAnswer[]) => void;
}

export default function ChatInterface({ applicationId, role, company, onSessionComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QuestionWithAnswer[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const generateQuestionMutation = useMutation({
    mutationFn: () => api.generateQuestions(role, company),
    onSuccess: (data: any) => {
      if (data.questions.length > 0) {
        const question = data.questions[0];
        setCurrentQuestion(question);
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "question",
          content: question,
          timestamp: new Date(),
        };
        
        setMessages((prev: ChatMessage[]) => [...prev, newMessage]);
      }
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ question, answer }: { question: string; answer: string }) => 
      api.getFeedback(question, answer, role),
    onSuccess: (feedback: InterviewFeedback, variables: { question: string; answer: string }) => {
      // Add feedback message
      const feedbackMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "feedback",
        content: feedback.overall,
        timestamp: new Date(),
        feedback,
      };
      
      setMessages((prev: ChatMessage[]) => [...prev, feedbackMessage]);
      
      // Save to session
      if (currentQuestion) {
        const questionWithAnswer: QuestionWithAnswer = {
          question: currentQuestion,
          answer: variables.answer,
          feedback,
          timestamp: new Date(),
        };
        
        setSessionQuestions((prev: QuestionWithAnswer[]) => [...prev, questionWithAnswer]);
      }
      
      // Clear current question
      setCurrentQuestion(null);
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: () => {
      if (!applicationId) throw new Error("No application ID");
      return api.createSession(applicationId, sessionQuestions);
    },
    onSuccess: (data: any) => {
      // notify parent with the saved questions, then clear local UI so the session ends immediately
      onSessionComplete?.(sessionQuestions);
      setMessages([]);
      setSessionQuestions([]);
      setCurrentQuestion(null);
    },
    onError: (err: any) => {
      console.error('Failed to save session:', err);
    }
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (currentQuestion) {
      // This is an answer to a question
      const answerMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "answer",
        content: input,
        timestamp: new Date(),
      };
      
      setMessages((prev: ChatMessage[]) => [...prev, answerMessage]);
      feedbackMutation.mutate({ question: currentQuestion, answer: input });
    }
    
    setInput("");
  };

  const startNewQuestion = () => {
    generateQuestionMutation.mutate();
  };

  const endSession = () => {
    if (sessionQuestions.length > 0 && applicationId) {
      saveSessionMutation.mutate();
    } else {
      onSessionComplete?.(sessionQuestions);
    }
  };

  const getFeedbackColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm h-fit">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">AI Interview Prep</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Practice with AI-generated questions tailored to {role} {company ? `at ${company}` : 'role'}.
        </p>
        
        {messages.length === 0 && (
          <Button
            onClick={startNewQuestion}
            disabled={generateQuestionMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            data-testid="button-start-practice"
          >
            {generateQuestionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Question...
              </>
            ) : (
              "Start Practice Session"
            )}
          </Button>
        )}
      </div>
      
      {messages.length > 0 && (
        <>
          <ScrollArea className="p-4 bg-muted/30 max-h-96" ref={scrollAreaRef} data-testid="chat-messages">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start space-x-3 ${
                  message.type === 'answer' ? 'justify-end' : ''
                }`}>
                  {message.type !== 'answer' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'question' 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                        : 'bg-green-500'
                    }`}>
                      {message.type === 'question' ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-xs ${
                    message.type === 'answer'
                      ? 'bg-primary text-primary-foreground rounded-lg p-3'
                      : message.type === 'feedback'
                      ? `border rounded-lg p-3 ${getFeedbackColor(message.feedback?.clarity || 1)}`
                      : 'bg-white rounded-lg p-3 shadow-sm border border-border'
                  }`}>
                    <p className="text-sm" data-testid={`message-${message.type}-${message.id}`}>
                      {message.content}
                    </p>
                    
                    {message.feedback && (
                      <div className="space-y-2 mt-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Clarity:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <div
                                key={rating}
                                className={`w-2 h-2 rounded-full ${
                                  rating <= message.feedback!.clarity ? 'bg-current' : 'bg-current opacity-20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Relevance:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <div
                                key={rating}
                                className={`w-2 h-2 rounded-full ${
                                  rating <= message.feedback!.relevance ? 'bg-current' : 'bg-current opacity-20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {message.feedback.suggestions.length > 0 && (
                          <div>
                            <span className="font-medium block mb-1">Tips:</span>
                            <ul className="list-disc list-inside space-y-1">
                              {message.feedback.suggestions.map((tip, index) => (
                                <li key={index}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'answer' && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-medium">
                      JD
                    </div>
                  )}
                </div>
              ))}
              
              {feedbackMutation.isPending && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-border">
                    <p className="text-sm text-muted-foreground">Analyzing your answer...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border space-y-3">
            {!currentQuestion && !feedbackMutation.isPending && (
              <div className="flex space-x-2">
                <Button
                  onClick={startNewQuestion}
                  disabled={generateQuestionMutation.isPending}
                  className="flex-1"
                  variant="outline"
                  data-testid="button-next-question"
                >
                  {generateQuestionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Next Question"
                  )}
                </Button>
                
                {sessionQuestions.length > 0 && (
                  <Button
                    onClick={endSession}
                    disabled={saveSessionMutation.isPending}
                    data-testid="button-end-session"
                  >
                    {saveSessionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "End Session"
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {currentQuestion && (
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={feedbackMutation.isPending}
                  className="flex-1"
                  data-testid="input-answer"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || feedbackMutation.isPending}
                  size="icon"
                  data-testid="button-send-answer"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
            
            {sessionQuestions.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                {sessionQuestions.length} question{sessionQuestions.length !== 1 ? 's' : ''} completed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
