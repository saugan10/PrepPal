import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/header";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { QuestionWithAnswer } from "@shared/schema";

export default function AiPrep() {
  const params = useParams();
  const applicationId = params.id;
  
  const [customPrep, setCustomPrep] = useState({
    role: "",
    company: "",
  });
  
  const [showChat, setShowChat] = useState(false);

  const { data: application } = useQuery({
    queryKey: ['/api/applications', applicationId],
    queryFn: () => api.getApplication(applicationId as string),
    enabled: !!applicationId,
  });

  const handleSessionComplete = (questions: QuestionWithAnswer[]) => {
    setShowChat(false);
    // Could show a success message or redirect
  };

  const startCustomSession = () => {
    if (customPrep.role.trim()) {
      setShowChat(true);
    }
  };

  const startApplicationSession = () => {
    if (application) {
      setShowChat(true);
    }
  };

  if (showChat) {
    const role = application?.role || customPrep.role;
    const company = application?.company || customPrep.company;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChat(false)}
              data-testid="button-back-to-prep"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
          </div>

          <div className="max-w-2xl mx-auto">
            <ChatInterface
              applicationId={applicationId}
              role={role}
              company={company}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">AI Interview Prep</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with AI-generated questions tailored to specific roles and get instant feedback on your answers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {application && (
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <span>Practice for Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid="text-app-role">{application.role}</h3>
                    <p className="text-muted-foreground" data-testid="text-app-company">{application.company}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Practice questions tailored specifically for this role at {application.company}. 
                    Your session will be saved to this application.
                  </p>
                  
                  <Button 
                    onClick={startApplicationSession} 
                    className="w-full bg-primary hover:bg-primary/90"
                    data-testid="button-start-application-session"
                  >
                    Start Practice Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 hover:border-border transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <span>Custom Practice</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-role">Job Role</Label>
                  <Input
                    id="custom-role"
                    value={customPrep.role}
                    onChange={(e) => setCustomPrep(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Senior React Developer"
                    className="mt-1"
                    data-testid="input-custom-role"
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-company">Company (Optional)</Label>
                  <Input
                    id="custom-company"
                    value={customPrep.company}
                    onChange={(e) => setCustomPrep(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., Google"
                    className="mt-1"
                    data-testid="input-custom-company"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Practice with questions for any role. This session won't be saved to a specific application.
                </p>
                
                <Button 
                  onClick={startCustomSession}
                  disabled={!customPrep.role.trim()}
                  className="w-full"
                  variant="outline"
                  data-testid="button-start-custom-session"
                >
                  Start Custom Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-center">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">AI Generates Questions</h4>
                  <p className="text-sm text-muted-foreground">
                    Get role-specific questions tailored to your target position
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Practice Your Answers</h4>
                  <p className="text-sm text-muted-foreground">
                    Answer questions in a chat-like interface at your own pace
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Get Instant Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed feedback on clarity, relevance, and improvement tips
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
