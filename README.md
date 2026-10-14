# Tracker Frontend

A React + Vite frontend application for the Tracker project management system.

## Features

- Project management dashboard
- Task and issue tracking
- Team collaboration
- Real-time notifications
- Analytics and reporting
- Multi-role support (Admin, Manager, Employee, Client)

## Tech Stack

- React 18
- Vite
- Context API for state management
- WebSocket for real-time updates
- Chart.js for analytics

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

For production (Vercel):

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_WS_URL=wss://your-backend-url.onrender.com
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

Deployed on Vercel. Connect your GitHub repository to Vercel and set the environment variables.

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── services/      # API services
├── context/       # React Context
├── hooks/         # Custom hooks
├── utils/         # Utility functions
└── assets/        # Static assets
```
