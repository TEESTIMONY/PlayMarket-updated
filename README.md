# PlayMarket Frontend

A modern React application built with TypeScript, Vite, and Tailwind CSS for the PlayMarket platform.

## Features

- **React 19** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **React Icons** for scalable iconography
- **Environment-based configuration** for different deployment stages
- **Optimized for Vercel deployment**

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: React Icons
- **Build Tool**: Vite with Terser optimization
- **Linting**: ESLint with TypeScript support

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── PM LOGO BLACK .png  # Logo assets
│   └── optimized/          # Optimized images
├── src/
│   ├── components/         # Reusable components
│   │   ├── Header.tsx      # Main navigation
│   │   ├── Sidebar.tsx     # Admin sidebar
│   │   └── admin/          # Admin-specific components
│   ├── pages/             # Page components
│   │   ├── AuctionPage.tsx
│   │   ├── BountiesPage.tsx
│   │   ├── RedeemPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/          # API services
│   │   └── api.ts         # API integration
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LoadingContext.tsx
│   ├── hooks/             # Custom hooks
│   │   └── usePageLoading.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── .env                   # Environment variables
├── .env.production        # Production environment
├── vercel.json            # Vercel configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies and scripts
```

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` and configure your environment variables
   - For development, the default configuration should work with the local backend

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000

# App Configuration
VITE_APP_NAME=PlayMarket
VITE_APP_VERSION=1.0.0
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style

This project uses ESLint for code linting. Make sure to run `npm run lint` before committing changes.

### Component Architecture

- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-specific components in `src/pages/`
- **Services**: API integration in `src/services/`
- **Contexts**: Global state management in `src/contexts/`

## Deployment

### Vercel Deployment

This project is optimized for Vercel deployment:

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel will automatically detect this as a Vite project

2. **Environment Variables**
   - Set `VITE_API_BASE_URL` to your production API endpoint
   - Add any other environment variables needed

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Automatic Deployment**
   - Vercel will automatically deploy on git push
   - Preview deployments for pull requests
   - Production deployments for main branch

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to any static hosting**
   - Upload the contents of the `dist/` folder
   - Configure your hosting to serve `index.html` for all routes (SPA routing)

## API Integration

The frontend communicates with the backend API through the `apiService` in `src/services/api.ts`. 

### API Endpoints

- **Bounties**: `/bounties/` - Manage bounties
- **Claims**: `/bounties/claims/` - Handle bounty claims
- **Redeem**: `/bounties/redeem/` - Redeem codes
- **Users**: `/bounties/users/` - User management
- **Admin**: `/bounties/admin/` - Administrative functions

### Authentication

The application supports both token-based and basic authentication. Tokens are stored in localStorage.

## Performance Optimizations

- **Code Splitting**: React.lazy for route-based code splitting
- **Bundle Optimization**: Terser minification and manual chunk splitting
- **Image Optimization**: Pre-optimized images in `/public/optimized/`
- **Caching**: Vercel CDN caching for static assets
- **Compression**: Gzip compression for production builds

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Specify your license here]

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team