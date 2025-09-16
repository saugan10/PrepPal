import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/header";
import ChatInterface from "@/components/chat-interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { QuestionWithAnswer } from "@shared/schema";

export default function ApplicationDetail() {
  const params = useParams();
  const id = params.id as string;

  const { data: application, isLoading, error } = useQuery({
    queryKey: ['/api/applications', id],
    queryFn: () => api.getApplication(id),
  });

  const handleSessionComplete = (questions: QuestionWithAnswer[]) => {
    // Refresh application data to show updated interview notes
    // This will be handled automatically by react-query cache invalidation
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Application Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The application you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/">
              <Button data-testid="button-back-to-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-amber-100 text-amber-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'dream':
        return 'bg-purple-100 text-purple-800';
      case 'target':
        return 'bg-green-100 text-green-800';
      case 'backup':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-2xl" data-testid="text-role">{application.role}</CardTitle>
                      <Badge className={getStatusColor(application.status)} data-testid="badge-status">
                        {application.status}
                      </Badge>
                      <Badge className={getTagColor(application.tag)} data-testid="badge-tag">
                        {application.tag}
                      </Badge>
                    </div>
                    <p className="text-xl text-muted-foreground font-medium mb-4" data-testid="text-company">
                      {application.company}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <span className="flex items-center" data-testid="text-applied-date">
                        <Calendar className="w-4 h-4 mr-1" />
                        Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                      </span>
                      
                      {application.jobUrl && (
                        <a 
                          href={application.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:text-primary/80 transition-colors"
                          data-testid="link-job-posting"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Job Posting
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {application.notes && (
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                      {application.notes}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Interview History */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Practice History</CardTitle>
              </CardHeader>
              <CardContent>
                {application.sessions && application.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {application.sessions.map((session, index) => (
                      <div key={session.id} className="border rounded-lg p-4" data-testid={`session-${session.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-foreground">
                            Practice Session #{index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {Array.isArray(session.questions) && session.questions.map((qa, qaIndex) => (
                            <div key={qaIndex} className="bg-muted/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-foreground mb-2">
                                Q: {qa.question}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                A: {qa.answer}
                              </p>
                              {qa.feedback && (
                                <div className="flex items-center space-x-4 text-xs">
                                  <span>Clarity: {qa.feedback.clarity}/5</span>
                                  <span>Relevance: {qa.feedback.relevance}/5</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">No practice sessions yet</p>
                    <p className="text-sm">Start an AI practice session to track your progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <ChatInterface
              applicationId={application.id}
              role={application.role}
              company={application.company}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
