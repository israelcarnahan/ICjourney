# Branch Summary: feat/api-google-places

## Status
- **Branch**: `feat/api-google-places`
- **Status**: Pushed to GitHub (origin/feat/api-google-places)
- **Current State**: Work in progress - moved back to main for other fixes
- **Last Commit**: `chore: update package-lock and fix CSS whitespace`

## Overview
This branch introduces Google Places API integration as a new data provider in the business data enrichment chain. The implementation adds a new provider that fetches business information (phone, website, opening hours, ratings, coordinates) from Google Places API to enhance pub/business data.

## Changes Summary

### New Files
1. **`src/api/googlePlacesProvider.ts`** (NEW)
   - Implements `BusinessDataProvider` interface
   - Queries Google Places API via proxy endpoints (`/api/places/find` and `/api/places/details`)
   - Maps Google Places data to `BusinessData` format
   - Handles phone numbers, websites, opening hours, ratings, and coordinates
   - Tracks provenance metadata for data sources

2. **`src/config/flags.ts`** (NEW)
   - Feature flags configuration
   - Provider enable/disable flags
   - Debug and logging flags
   - Exposes flags to window for debugging

### Modified Files

1. **`src/api/useBusinessData.ts`**
   - Integrated `googlePlacesProvider` into provider chain
   - Provider order: Postcodes → Google → Nominatim → Fallback
   - Added provider logging and debugging support

2. **`src/api/types.ts`**
   - Extended `BusinessData` type with Google-specific metadata
   - Added provenance tracking for data sources (google, user, fallback)
   - Added fields for Google ratings, opening hours text, coordinates

3. **`src/api/fallbackProvider.ts`**
   - Minor updates to work with new provider chain

4. **`src/api/nominatimProvider.ts`**
   - Updated to work with new provider chain structure

5. **`src/api/postcodesProvider.ts`**
   - Updated to work with new provider chain structure

6. **`src/components/VisitScheduler.tsx`**
   - Updated to use new business data provider system

7. **`src/config/api.ts`**
   - Added Google Places API configuration
   - Field masks for find and details endpoints

8. **`vite.config.ts`**
   - Added Vite dev server proxy for Google Places API
   - Proxy endpoints:
     - `/api/places/find` → Google Places v1 `searchText`
     - `/api/places/details` → Google Places v1 place details
   - Handles API key from environment variable `GOOGLE_PLACES_KEY`
   - Region code set to 'GB' (Great Britain)
   - Language code set to 'en'

9. **`src/utils/seedFromPub.ts`**
   - Updated to work with new provider system

10. **`package-lock.json`**
    - Updated dependencies (likely from npm install)

11. **`src/index.css`**
    - Minor whitespace formatting fix

## Technical Implementation Details

### Provider Chain Architecture
The Google Places provider is integrated into a multi-provider chain that runs sequentially:
1. **PostcodesProvider**: Gets basic postcode data (lat/lng, region)
2. **GooglePlacesProvider**: Enriches with Google Places data (phone, website, hours, ratings)
3. **NominatimProvider**: Fallback geocoding via OpenStreetMap
4. **FallbackProvider**: Provides default opening hours and final data structure

### API Integration
- Uses Google Places API v1 (new Places API)
- Requires `GOOGLE_PLACES_KEY` environment variable
- Proxy pattern: Frontend calls `/api/places/*` endpoints, Vite dev server proxies to Google
- Two-step process:
  1. `searchText` to find place by name + postcode
  2. Place details endpoint to get full information

### Data Mapping
Google Places data is mapped to `BusinessData`:
- `internationalPhoneNumber` / `nationalPhoneNumber` → `phone`
- `websiteUri` → `extras.website`
- `currentOpeningHours.weekdayDescriptions` → `extras.google_opening_hours_text`
- `location` → `extras.lat`, `extras.lng`
- `rating` → `extras.google_rating`
- `userRatingCount` → `extras.google_ratings_count`

### Error Handling
- Provider never throws - returns `null` on errors to allow other providers to run
- Graceful degradation: if Google fails, other providers still execute
- Debug logging throughout for troubleshooting

## Configuration Required

### Environment Variables
```env
GOOGLE_PLACES_KEY=your_google_places_api_key_here
```

### Feature Flags
In `src/config/flags.ts`:
- `FLAGS.PROVIDERS.GOOGLE_PLACES`: Enable/disable Google provider
- `FLAGS.DEBUG`: Enable debug logging
- `FLAGS.LOG_PROVIDERS`: Log provider execution

## Known Issues / Incomplete Work

1. **API Key Management**: Currently requires manual `.env` setup - no UI for configuration
2. **Error Handling**: Basic error handling in place, but could be more robust
3. **Rate Limiting**: No rate limiting implementation for Google API calls
4. **Caching**: Uses in-memory cache in `useBusinessData`, but no persistent cache
5. **Opening Hours Parsing**: Google provides text descriptions, but not parsed into structured `OpeningHours` format
6. **Testing**: No unit tests for the new provider
7. **Production Build**: Proxy only works in dev mode - needs backend API for production

## Dependencies Added
- `@googlemaps/js-api-loader`: ^1.16.10 (already in package.json)
- `@types/google.maps`: ^3.58.1 (dev dependency, already in package.json)

## Next Steps (When Resuming Work)

1. **Backend API**: Create production API endpoints to replace Vite proxy
2. **Opening Hours Parsing**: Parse Google's text format into structured `OpeningHours` type
3. **Rate Limiting**: Implement rate limiting for Google API calls
4. **Error Handling**: Improve error messages and user feedback
5. **Testing**: Add unit tests for `GooglePlacesProvider`
6. **Documentation**: Update README with Google Places setup instructions
7. **Cost Monitoring**: Add logging/monitoring for API usage and costs
8. **Fallback Strategy**: Improve fallback when Google API is unavailable
9. **Data Validation**: Validate Google API responses before using
10. **UI Integration**: Show Google-sourced data in UI with provenance indicators

## Files to Review When Resuming
- `src/api/googlePlacesProvider.ts` - Main provider implementation
- `vite.config.ts` - Proxy configuration (lines 4-66)
- `src/config/flags.ts` - Feature flags
- `src/api/useBusinessData.ts` - Provider chain integration

## Branch Comparison
Compared to `main`, this branch adds:
- 1 new provider file
- 1 new config file
- Updates to 9 existing files
- No breaking changes to existing functionality

## Notes
- The branch was moved back to main because other pieces need fixing before continuing with API integration
- The implementation is functional but needs production-ready backend API
- All changes are backward compatible - existing providers still work

