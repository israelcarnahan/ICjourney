# IC Journey Planner - Project Summary

## Project Overview

**IC Journey Planner** is a modern web application designed for field sales representatives to efficiently plan and manage customer visits across territories. The application helps sales reps optimize their routes, prioritize accounts, and manage visit schedules with intelligent algorithms.

## Technology Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS 3.4.1 with custom theme
- **UI Components**: Radix UI primitives
- **Routing**: React Router DOM 6.22.3
- **State Management**: React Context API
- **Data Persistence**: localStorage via custom persistence service
- **File Processing**: xlsx-js-style for Excel file handling
- **Date Handling**: date-fns 3.3.1
- **Maps**: Google Maps API (via @googlemaps/js-api-loader)
- **Icons**: Lucide React

## Core Features

### 1. File Upload & Processing

- Upload Excel files (Masterfile, Hitlist, Recent Wins, Unvisited lists)
- Column mapping wizard for flexible file formats
- Automatic deduplication with fuzzy matching
- File type detection and configuration
- Support for priority levels, deadlines, and follow-up days(deffered)

### 2. Visit Scheduling

- Intelligent route optimization algorithm
- Priority-based scheduling (deadlines, recent wins, wishlist, unvisited)
- Geographic clustering of nearby accounts
- Configurable visits per day
- Business days calculation
- Home address-based route planning
- Search radius configuration

### 3. Schedule Management

- Interactive schedule display with daily/weekly views
- Drag-and-drop visit rescheduling
- Visit replacement and regeneration
- Unscheduled pubs panel
- Drive time calculations
- Visit notes and annotations

### 4. Data Enrichment

- Multi-provider business data enrichment chain:
  - Postcodes API (UK postcode data)
  - Google Places API (in development branch)
  - Nominatim/OpenStreetMap (geocoding)
  - Fallback provider (defaults)
- Opening hours detection and display
- Business information enrichment (phone, website, ratings)

### 5. Export & Reporting

- Export schedules to Excel with styling
- Calendar export (ICS format)
- Schedule reports and statistics
- Coverage heat maps
- Rep statistics panel

### 6. User Interface

- Modern, dark-themed UI with neon accents
- Responsive design for all devices
- Animated components and transitions
- Error boundaries and loading states
- Authentication via Google (LoginGate)

## Areas for Improvement

### 1. Code Quality & Architecture

- **Large Component Files**: `PlannerDashboard.tsx` (949 lines) and `ScheduleDisplay.tsx` (1261 lines) are too large

  - **Action**: Break down into smaller, focused components
  - **Priority**: Medium
  - **Note**: Some refactoring has been done (GenerateControls and UploadedFilesPanel extracted from PlannerDashboard), but components remain large

- **Type Safety**: Some `any` types and type assertions throughout codebase

  - **Action**: Improve TypeScript strictness, remove `any` types
  - **Priority**: Medium

- **Code Duplication**: Similar logic in multiple places (e.g., schedule generation)
  - **Action**: Extract shared logic into utilities or hooks
  - **Priority**: Low

### 2. Performance

- **Large File Processing**: Excel files with many rows may cause performance issues

  - **Action**: Implement streaming/chunked processing for large files
  - **Priority**: Medium

- **Schedule Generation**: Complex algorithm may be slow for large datasets

  - **Action**: Optimize algorithm, add progress indicators, consider Web Workers
  - **Priority**: Medium

- **Re-renders**: Some components may re-render unnecessarily
  - **Action**: Add React.memo, useMemo, useCallback where appropriate
  - **Priority**: Low

### 3. Error Handling & User Experience

- **Error Messages**: Some error messages are generic or technical

  - **Action**: Improve error messages to be user-friendly and actionable
  - **Priority**: Medium

- **Loading States**: Some async operations lack loading indicators

  - **Action**: Add loading states for all async operations
  - **Priority**: Low

- **Offline Support**: No offline functionality
  - **Action**: Implement service worker and offline data caching
  - **Priority**: Low

### 4. Testing

- **No Test Coverage**: No unit tests, integration tests, or E2E tests

  - **Action**: Add test suite (Jest, React Testing Library, Playwright)
  - **Priority**: High

- **Manual Testing Only**: All testing is manual
  - **Action**: Implement automated testing pipeline
  - **Priority**: High

### 5. Security

- **API Keys**: Google API keys may be exposed in client code

  - **Action**: Move API calls to backend, never expose keys in frontend
  - **Priority**: High

- **Input Validation**: Limited validation on user inputs

  - **Action**: Add comprehensive input validation and sanitization
  - **Priority**: Medium

- **XSS Prevention**: Ensure all user inputs are properly sanitized
  - **Action**: Review and audit for XSS vulnerabilities
  - **Priority**: Medium

### 6. Data Management

- **localStorage Limitations**: Using localStorage for all data persistence

  - **Action**: Consider IndexedDB for larger datasets, add backend sync
  - **Priority**: Low

- **Data Loss Risk**: No backup/export of user data

  - **Action**: Add data export/import functionality
  - **Priority**: Medium

- **Cache Management**: In-memory cache in business data provider
  - **Action**: Implement persistent cache with TTL
  - **Priority**: Low

### 7. Documentation

- **README**: Basic README with minimal information

  - **Action**: Expand README with setup, architecture, and contribution guides
  - **Priority**: Medium

- **Code Comments**: Limited inline documentation

  - **Action**: Add JSDoc comments to public APIs and complex functions
  - **Priority**: Low

- **API Documentation**: No API documentation for providers
  - **Action**: Document provider interfaces and data flow
  - **Priority**: Low

### 8. Accessibility

- **ARIA Labels**: Limited ARIA labels and accessibility features

  - **Action**: Add proper ARIA labels, keyboard navigation, screen reader support
  - **Priority**: Medium

- **Color Contrast**: Verify all color combinations meet WCAG standards
  - **Action**: Audit and fix color contrast issues
  - **Priority**: Medium

### 9. Mobile Experience

- **Touch Interactions**: Some interactions may not be mobile-friendly

  - **Action**: Improve touch targets, swipe gestures, mobile layout
  - **Priority**: Medium

- **Performance on Mobile**: May be slow on lower-end devices
  - **Action**: Optimize for mobile performance, reduce bundle size
  - **Priority**: Low

### 10. Feature Completeness

- **Google Places Integration**: Incomplete (in branch, needs backend API)

  - **Action**: Complete Google Places integration with production backend
  - **Priority**: Medium

- **Maps Integration**: Placeholder maps service

  - **Action**: Implement full Google Maps integration for route visualization
  - **Priority**: Low

- **Real-time Updates**: No real-time collaboration or updates
  - **Action**: Consider WebSocket or polling for real-time features
  - **Priority**: Low

## Established TODOs

### Code TODOs Found

1. **`src/utils/scheduleUtils.ts:107`**

   ```typescript
   // const [homePrefix] = extractNumericPart(homeAddress); // TODO: Use for distance calculations
   ```

   - **Status**: Not implemented
   - **Priority**: Low

2. **`src/context/PubDataContext.tsx:450`**

   ```typescript
   // clearMappings(userId); // TODO: Implement clearMappings function
   ```

   - **Status**: Not implemented
   - **Priority**: Low

3. **`src/utils/openingHours.ts:51`**

   ```typescript
   // const now = new Date(); // TODO: Use for time-based checks
   ```

   - **Status**: Not implemented
   - **Priority**: Low

4. **`src/context/AuthContext.tsx:37`**
   ```typescript
   // const _oldId = userId; // TODO: Use for cleanup if needed
   ```
   - **Status**: Not implemented
   - **Priority**: Low

### Feature TODOs (from About page)

1. Interactive Planning - refined visit logic with drag-and-drop scheduling
2. Mock & Live API Support - seamless switching between test data and real-world accounts
3. Schedule Visualization - enhanced daily & weekly journey timelines
4. Smart Regeneration - with filters, rules, and user guidance
5. Expanded Export Tools - including CSV, PDF, and future mobile sync

## Security Vulnerabilities

### Current Vulnerabilities (from npm audit)

#### Vite Vulnerabilities - RESOLVED ✅

All previously identified Vite vulnerabilities have been resolved:

1. **GHSA-g4jq-h2w9-997c** (Low) - **RESOLVED**

   - **Issue**: Vite middleware may serve files starting with the same name with the public directory
   - **Affected**: vite >=6.0.0 <=6.3.5
   - **Status**: Fixed in vite 6.4.1 (currently installed)

2. **GHSA-jqfw-vq24-v9c3** (Low) - **RESOLVED**

   - **Issue**: Vite's `server.fs` settings were not applied to HTML files
   - **Affected**: vite >=6.0.0 <=6.3.5
   - **Status**: Fixed in vite 6.4.1 (currently installed)

3. **GHSA-93m4-6634-74q7** (Moderate) - **RESOLVED**
   - **Issue**: vite allows server.fs.deny bypass via backslash on Windows
   - **Affected**: vite >=6.0.0 <=6.4.0
   - **Status**: Fixed in vite 6.4.1 (currently installed)

**Current Status**: No known vulnerabilities in dependencies (as of last audit)

### Recommended Actions

1. ✅ **Update Vite**: Completed - Vite updated to 6.4.1 (vulnerabilities resolved)
2. **Review Dependencies**: Regularly run `npm audit` and update dependencies
3. **API Key Security**: Move all API keys to backend, never expose in frontend
4. **Input Sanitization**: Ensure all user inputs are validated and sanitized
5. **CSP Headers**: Implement Content Security Policy headers
6. **HTTPS Only**: Ensure all API calls use HTTPS
7. **Rate Limiting**: Implement rate limiting for API endpoints (when backend is added)

## Dependencies Overview

- **Total Dependencies**: 428 (222 production, 205 dev, 47 optional)
- **Known Vulnerabilities**: 0 (all previously identified Vite vulnerabilities resolved in 6.4.1)
- **Outdated Packages**: Review with `npm outdated`

## Development Workflow

### Current Setup

- **Pre-push Hook**: Type checking via `tsc --build --noEmit`
- **Linting**: ESLint with TypeScript rules
- **Type Checking**: Separate `tsconfig.typecheck.json` for type checking

### Recommended Improvements

1. **Pre-commit Hooks**: Add Husky for pre-commit linting and formatting
2. **CI/CD**: Set up GitHub Actions for automated testing and deployment
3. **Code Formatting**: Add Prettier for consistent code formatting
4. **Dependency Updates**: Use Dependabot or Renovate for automated dependency updates

## Deployment

- **Current**: Deployed to Render.com (israelsjourneyplanner.onrender.com, icjourney.onrender.com)
- **Build Command**: `npm run build`
- **Environment**: Production builds via Vite

## Next Steps (Priority Order)

### High Priority

1. ✅ **Fix Vite vulnerabilities** - COMPLETED (updated to 6.4.1)
2. ⏳ Add test suite (unit tests, integration tests)
3. ⏳ Move API keys to backend (security)
4. ⏳ Improve error handling and user feedback

### Medium Priority

1. ⏳ **Refactor large components** - PARTIAL (GenerateControls and UploadedFilesPanel extracted, but components still large)
2. ⏳ Complete Google Places integration with backend API
3. ⏳ Improve TypeScript strictness
4. ⏳ Add comprehensive input validation
5. ⏳ Expand documentation (README, code comments)

### Low Priority

1. ✅ Optimize performance for large datasets
2. ✅ Add offline support
3. ✅ Improve accessibility
4. ✅ Enhance mobile experience
5. ✅ Implement persistent caching

## Notes

- Project is actively developed and functional
- Main branch is stable and production-ready
- `feat/api-google-places` branch contains incomplete Google Places integration. See [](docs/BRANCH_SUMMARY_feat-api-google-places.md)
- Scheduling driver 'followup-by-date' deffered, see [](docs/followup-by-date.md)
- No breaking changes planned in near term
- Focus should be on stability, testing, and security before adding new features
- **Last Summary Update**: January 2025 (62+ commits since original summary creation on Dec 27, 2025)
- Recent development includes: deadline urgency threshold adjustments, selection debug traces, mock geo truth engine, and scheduling algorithm improvements
