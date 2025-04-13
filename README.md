# Journey Planner

A modern web application for efficiently planning and managing visits across territories. Built with React and TypeScript.

## Features

- Interactive visit planning interface
- Real-time route optimization
- Customizable visit schedules
- Export functionality for various formats
- Responsive design for all devices

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application Configuration
VITE_APP_TITLE=Journey Planner
VITE_APP_DESCRIPTION=Plan your visits efficiently
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/journey-planner.git
cd journey-planner
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Fill in your configuration

5. Start the development server:

```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Mock API Implementation

The application includes a comprehensive mock API layer that simulates real API responses for development and testing purposes. This allows for development without requiring actual API keys or making real API calls.

### Configuration

To enable the mock API, set the following environment variable:

```bash
VITE_USE_MOCK_API=true
```

### Available Mock Endpoints

1. **Geocoding (`getCoordinatesFromQuery`)**

   - Simulates Mapbox Geocoding API
   - Returns location data in Mapbox format
   - Includes realistic UK coordinates based on postcode patterns
   - 10% chance of simulated service unavailability

2. **Directions (`getOptimizedRoute`)**

   - Simulates Mapbox Directions API
   - Returns route data with realistic distances and durations
   - Includes waypoints and route geometry
   - 10% chance of simulated service unavailability

3. **Places Search (`getNearbyPubs`)**

   - Simulates Foursquare/Google Places API
   - Returns pub data with realistic locations and details
   - Includes distance, geocodes, and location information
   - 10% chance of simulated service unavailability

4. **Business Details (`getBusinessDetails`)**
   - Simulates enhanced business details API
   - Returns comprehensive pub information including:
     - Contact details
     - Opening hours
     - Ratings and reviews
     - Photos
   - 10% chance of simulated service unavailability

### Error Handling

The mock API includes realistic error handling:

- 10% chance of service unavailability for each endpoint
- Proper error messages and logging
- Consistent error response format

### Switching to Real APIs

To switch from mock to real APIs:

1. Set `VITE_USE_MOCK_API=false` in your environment
2. Implement the real API endpoints with the same interface
3. Add your API keys to the environment variables

Example real API implementation:

```typescript
// src/api/realApi.ts
export const getCoordinatesFromQuery = async (query: string) => {
  if (import.meta.env.VITE_USE_MOCK_API === "true") {
    return getMockCoordinatesFromQuery(query);
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
  );
  return response.json();
};
```

### Testing

The mock API includes comprehensive test coverage:

- Response structure validation
- Error handling
- API toggle functionality
- Data format consistency

To run the tests:

```bash
npm test
```
