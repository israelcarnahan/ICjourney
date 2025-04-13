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

The application includes a comprehensive mock API implementation for testing and development purposes. This section explains how to use and configure the mock API.

### Configuration

To enable the mock API, set the following environment variable in your `.env` file:

```env
VITE_USE_MOCK_API=true
```

When enabled, the mock API will:

- Simulate realistic API responses
- Include random delays to mimic real network conditions
- Generate realistic UK-based data
- Provide detailed error handling and logging

### Available Mock Endpoints

1. **Geocoding (`getCoordinatesFromQuery`)**

   - Simulates Mapbox's geocoding API
   - Returns location data in the exact format of Mapbox's API
   - Supports both postcodes and place names
   - Includes realistic UK coordinates

2. **Directions (`getOptimizedRoute`)**

   - Simulates Mapbox's directions API
   - Returns route data with:
     - Distance in meters
     - Duration in seconds
     - Detailed geometry
     - Step-by-step instructions

3. **Business Details (`getBusinessDetails`)**
   - Returns comprehensive business information including:
     - Contact details
     - Opening hours
     - Ratings (Google and Yelp)
     - Photos and reviews

### Error Handling

The mock API includes realistic error scenarios:

- 5% chance of service unavailability
- 10% chance of missing business data
- Proper error logging with emoji indicators
- Detailed error messages

### Switching to Real APIs

To switch from mock to real APIs:

1. Set `VITE_USE_MOCK_API=false` in your `.env` file
2. Implement the real API functions with the same signatures as the mock ones
3. Update the API configuration in your application

Example of switching implementations:

```typescript
// In your API service file
import { getCoordinatesFromQuery as mockGeocode } from "./mockApi";
import { getCoordinatesFromQuery as realGeocode } from "./realApi";

export const getCoordinatesFromQuery = (query: string) => {
  return USE_MOCK_API ? mockGeocode(query) : realGeocode(query);
};
```

### Testing

The mock API includes a comprehensive test suite. Run tests with:

```bash
npm test
```

Tests verify:

- Response formats match real API structures
- Error handling works as expected
- Data generation is realistic
- Configuration toggles work correctly
