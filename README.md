# Frontend - Team Task Manager

Next.js 14 frontend application with App Router, TypeScript, and Tailwind CSS.

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API server running (see [Backend README](../backend/README.md))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, update this to your deployed backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home/landing page
│   │   ├── login/             # Login page
│   │   ├── register/         # Registration page
│   │   ├── dashboard/         # Dashboard page
│   │   └── projects/         # Project pages
│   │       └── [id]/         # Project detail with Kanban board
│   ├── components/            # React components
│   │   ├── Layout.tsx        # Main layout with sidebar
│   │   ├── KanbanBoard.tsx   # Drag-and-drop Kanban board
│   │   ├── TaskCard.tsx      # Individual task card
│   │   ├── TaskDetailModal.tsx  # Task detail/edit modal
│   │   ├── CreateTaskModal.tsx  # Create task modal
│   │   └── SuppressWarnings.tsx # Console warning suppression
│   ├── context/               # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── ThemeContext.tsx   # Dark/light theme state
│   ├── lib/                   # Utilities
│   │   └── api.ts            # Axios API client
│   └── types/                 # TypeScript definitions
│       └── react-beautiful-dnd.d.ts
├── public/                    # Static assets
├── package.json
└── README.md
```

## 🎨 Features

### Pages
- **Home** (`/`): Landing page with login/register options
- **Login** (`/login`): User authentication
- **Register** (`/register`): New user registration
- **Dashboard** (`/dashboard`): Overview of all projects and tasks
- **Project Detail** (`/projects/[id]`): Kanban board for task management

### Components
- **KanbanBoard**: Drag-and-drop task board with three columns
- **TaskCard**: Individual task display with priority, assignee, due date
- **TaskDetailModal**: View/edit task details, comments, attachments
- **CreateTaskModal**: Create new tasks
- **Layout**: Main application layout with sidebar navigation

### State Management
- **AuthContext**: Manages user authentication state
- **ThemeContext**: Manages dark/light theme preference

## 🛠️ Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Context API**: State management
- **Axios**: HTTP client for API calls
- **@hello-pangea/dnd**: Drag-and-drop library
- **React Icons**: Icon library
- **date-fns**: Date formatting utilities

## 📦 Key Dependencies

```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3",
  "tailwindcss": "^3.4.0",
  "@hello-pangea/dnd": "^16.3.0",
  "axios": "^1.6.2",
  "react-icons": "^4.12.0",
  "date-fns": "^2.30.0"
}
```

## 🎯 Key Features Implementation

### Drag & Drop
- Uses `@hello-pangea/dnd` for React 18 compatibility
- Optimistic UI updates for smooth experience
- Position-based task ordering

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interactions

### Dark Mode
- System preference detection
- Manual toggle option
- Persistent theme preference

### Error Handling
- Centralized error handling in API client
- User-friendly error messages
- Automatic token refresh on 401 errors

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for code formatting (if configured)

## 🐛 Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Clear `.next` directory and rebuild
- Check TypeScript errors with `npm run lint`

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure backend server is running
- Check CORS configuration in backend

### Drag & Drop Not Working
- Ensure `@hello-pangea/dnd` is installed
- Check browser console for errors
- Verify component is client-side (`"use client"`)

## 📝 Notes

- All pages use `export const dynamic = 'force-dynamic'` for client-side rendering
- API calls are made through centralized `api.ts` client
- Authentication tokens are stored in localStorage
- Theme preference is stored in localStorage
