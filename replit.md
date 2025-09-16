# Interview Prep Assistant

## Overview

This is a full-stack web application that helps job seekers manage job applications and practice for interviews using AI-powered assistance. The application combines traditional CRUD operations for job application tracking with interactive AI features powered by Google's Gemini AI to provide personalized interview preparation.

The system allows users to:
- Manage job applications with detailed tracking (company, role, status, tags)
- Generate role-specific interview questions using AI
- Practice answers in an interactive chat interface
- Receive AI feedback on responses with actionable improvement suggestions
- Store interview practice sessions for future reference

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Development**: tsx for development server with hot reloading
- **Production Build**: esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL using Drizzle ORM as the query builder
- **Schema Definition**: Shared TypeScript schemas with Zod validation
- **Connection**: Neon Database serverless PostgreSQL
- **Migrations**: Drizzle Kit for database schema management
- **Session Storage**: In-memory storage implementation with interface for future database integration

### AI Integration
- **Provider**: Google Gemini AI (2.5-flash model)
- **Features**: 
  - Role-specific interview question generation
  - Answer feedback with structured response format
  - JSON schema enforcement for consistent API responses
- **Implementation**: Centralized service layer with error handling and fallbacks

### Authentication & Session Management
- **Current**: No authentication implemented (suitable for single-user or development)
- **Session Storage**: PostgreSQL-based session store configured (connect-pg-simple)
- **Future**: Ready for NextAuth.js integration as indicated in dependencies

### External Dependencies

**Core Runtime**:
- Node.js with Express.js server framework
- TypeScript for type safety across the stack

**Database & ORM**:
- PostgreSQL (via Neon serverless)
- Drizzle ORM for type-safe database queries
- Drizzle Kit for schema migrations

**AI Services**:
- Google Gemini AI for interview question generation and feedback
- Structured JSON responses with schema validation

**Frontend Libraries**:
- React with TypeScript and Vite
- TanStack Query for server state management
- Wouter for lightweight routing
- React Hook Form with Zod validation
- shadcn/ui + Radix UI for component primitives
- Tailwind CSS for styling
- Lucide React for icons

**Development Tools**:
- Vite with React plugin for development server
- esbuild for production bundling
- tsx for TypeScript execution
- Replit-specific development plugins for enhanced developer experience

**Utility Libraries**:
- date-fns for date manipulation
- clsx and tailwind-merge for conditional styling
- class-variance-authority for component variants