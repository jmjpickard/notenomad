# NoteNomad

A powerful note-taking application for digital nomads, built with the [T3 Stack](https://create.t3.gg/).

## Features

- Modern, responsive UI built with Tailwind CSS and Shadcn UI
- Rich text editing with BlockNote
- User authentication with NextAuth
- Database integration with Prisma
- Type-safe API with tRPC
- Email notifications with Resend

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/jmjpickard/notenomad.git
   cd notenomad
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your values.

4. Initialize the database:

   ```bash
   npm run db:generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Lint code
- `npm run format:write` - Format code

## Deployment

This application can be deployed to Vercel or any other hosting service that supports Next.js applications.

## Technologies

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [BlockNote](https://blocknote.dev)
- [Shadcn UI](https://ui.shadcn.com)
