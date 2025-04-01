# Journey Planner

A modern web application for efficiently planning and managing pub visits across territories. Built with React, TypeScript, and Google Maps integration.

## Features

- 📅 Interactive schedule planning and management
- 🗺️ Territory coverage visualization with heat maps
- 🚗 Vehicle selection and route optimization
- ⏱️ Smart time management with opening hours consideration
- 📊 Coverage statistics and reporting
- 📱 Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Maps API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/israelcarnahan/JourneyPlanner_April1.git
cd JourneyPlanner_April1
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Fill in your Google Maps API credentials and other configuration

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id
VITE_GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
```

See `.env.example` for all available configuration options.

## Project Structure

```
src/
├── components/     # React components
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # External service integrations
├── utils/         # Utility functions
└── config/        # Configuration files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
