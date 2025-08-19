# Overview

This is a real-time chat web application built with a modern full-stack architecture. The app provides Instagram-like chat UI with Telegram-style features, including text messaging, media sharing, and real-time communication. Users can create accounts with unique IDs, discover other public users, and engage in private conversations. The application implements automatic data cleanup policies and uses Firebase for real-time messaging while maintaining persistent logs in Google Sheets.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React 18 application using functional components and hooks
- **Vite Build Tool**: Fast development server and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built component library
- **Wouter Router**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching for API interactions

## Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **WebSocket Integration**: Real-time bidirectional communication using native WebSocket API
- **Memory Storage**: In-memory data storage with interface for future database integration
- **Drizzle ORM**: Type-safe database toolkit configured for PostgreSQL (schema-ready)
- **File Upload Handling**: Multer middleware for processing media uploads

## Data Storage Solutions
- **PostgreSQL Database**: Primary data storage using Drizzle ORM with predefined schema for users, chats, messages, and contacts
- **Firebase Realtime Database**: Real-time message synchronization and presence detection
- **Google Sheets Integration**: Permanent message logging via Google Apps Script API
- **Cloudinary CDN**: Media file storage and optimization for images, videos, and documents

## Authentication and Authorization
- **Unique ID System**: Users receive auto-generated unique identifiers instead of traditional email/phone login
- **Recovery Codes**: Secure backup authentication method for account recovery
- **Session Management**: Local storage-based session persistence with user state management
- **Public/Private Profiles**: Configurable user visibility settings for discovery features

## External Dependencies
- **Firebase**: Real-time database, user presence, and messaging synchronization
- **Cloudinary**: Media upload, storage, transformation, and CDN delivery
- **Google Sheets API**: Permanent message archival via Google Apps Script webhook
- **Neon Database**: PostgreSQL hosting service (configured but not actively used in current memory storage)

## Key Design Patterns
- **Real-time Communication**: WebSocket connections maintain persistent bidirectional channels for instant messaging
- **Automatic Cleanup**: Scheduled jobs remove messages after 7 days and inactive chats after 2 days to optimize Firebase usage
- **Dual Storage Strategy**: Active data in Firebase for real-time features, permanent logs in Google Sheets for compliance
- **Progressive Enhancement**: Graceful degradation when real-time features are unavailable
- **Component Composition**: Modular UI components using shadcn/ui patterns with consistent theming