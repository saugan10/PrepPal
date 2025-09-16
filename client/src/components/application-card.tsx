import { Link } from "wouter";
import type { Application } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Zap, Eye, Trash2, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApplicationCardProps {
  application: Application;
  onEdit?: (application: Application) => void;
}

export default function ApplicationCard({ application, onEdit }: ApplicationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: api.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    },
  });

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

  const practiceCount = Array.isArray(application.interviewNotes) ? application.interviewNotes.length : 0;
  const notesCount = application.notes ? 1 : 0;

  return (
    <div 
      className="p-6 hover:bg-accent/50 transition-colors border-b border-border last:border-b-0" 
      data-testid={`card-application-${application.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Link href={`/application/${application.id}`}>
              <a className="text-lg font-semibold text-foreground hover:text-primary transition-colors" data-testid={`link-application-${application.id}`}>
                {application.role}
              </a>
            </Link>
            <Badge className={getStatusColor(application.status)} data-testid={`badge-status-${application.status}`}>
              {application.status}
            </Badge>
            <Badge className={getTagColor(application.tag)} data-testid={`badge-tag-${application.tag}`}>
              {application.tag}
            </Badge>
          </div>
          
          <p className="text-muted-foreground font-medium" data-testid={`text-company-${application.id}`}>
            {application.company}
          </p>
          
          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-applied-${application.id}`}>
            Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
          </p>
          
          <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center" data-testid={`text-practice-count-${application.id}`}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              {practiceCount} practice session{practiceCount !== 1 ? 's' : ''}
            </span>
            {notesCount > 0 && (
              <span className="flex items-center" data-testid={`text-notes-count-${application.id}`}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {notesCount} note{notesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/ai-prep/${application.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              title="Start AI Prep"
              data-testid={`button-ai-prep-${application.id}`}
            >
              <Zap className="w-4 h-4" />
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                data-testid={`button-menu-${application.id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/application/${application.id}`}>
                <DropdownMenuItem data-testid={`menu-view-${application.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </Link>
              {onEdit && (
                <DropdownMenuItem 
                  onClick={() => onEdit(application)}
                  data-testid={`menu-edit-${application.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(application.id)}
                className="text-destructive"
                data-testid={`menu-delete-${application.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
