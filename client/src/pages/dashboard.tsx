import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/header";
import StatsCards from "@/components/stats-cards";
import ApplicationCard from "@/components/application-card";
import ApplicationForm from "@/components/application-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "All",
    tag: "All",
    search: "",
    page: 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/applications', filters],
    queryFn: () => api.getApplications({
      status: filters.status !== "All" ? filters.status : undefined,
      tag: filters.tag !== "All" ? filters.tag : undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: 10,
    }),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-foreground">Job Applications</h2>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    data-testid="button-add-application"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Application
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-muted-foreground">Status:</label>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger className="w-32" data-testid="select-filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-muted-foreground">Tag:</label>
                    <Select value={filters.tag} onValueChange={(value) => handleFilterChange('tag', value)}>
                      <SelectTrigger className="w-32" data-testid="select-filter-tag">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="dream">Dream</SelectItem>
                        <SelectItem value="target">Target</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 max-w-sm">
                    <Input
                      type="text"
                      placeholder="Search companies..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-destructive">
                    Failed to load applications. Please try again.
                  </div>
                ) : data?.applications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p className="text-lg font-medium mb-2">No applications found</p>
                    <p className="text-sm">Start by adding your first job application</p>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="mt-4"
                      data-testid="button-add-first-application"
                    >
                      Add Application
                    </Button>
                  </div>
                ) : (
                  data?.applications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                    />
                  ))
                )}
              </div>
              
              {data && data.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground" data-testid="pagination-info">
                      Showing {((filters.page - 1) * 10) + 1} to {Math.min(filters.page * 10, data.total)} of {data.total} applications
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      
                      {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                        const page = i + 1;
                        const isActive = page === filters.page;
                        return (
                          <Button
                            key={page}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            data-testid={`button-page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= data.totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">AI Interview Prep</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Practice with AI-generated questions tailored to your target role.
                </p>
                <Button
                  onClick={() => window.location.href = "/ai-prep"}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  data-testid="button-start-ai-prep"
                >
                  Start Practice Session
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <p className="text-sm">Start a practice session to see your conversation</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border shadow-sm mt-6">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Your latest application updates</p>
              </div>
              
              <div className="p-4">
                <div className="text-center text-muted-foreground">
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ApplicationForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
      />
    </div>
  );
}
