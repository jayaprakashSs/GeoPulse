import { LocationPoint } from '../types';

/**
 * Fetches location points from a given API URL.
 * Falls back to local static JSON mock-data if the URL is unreachable or resolves with an error.
 * 
 * @param url The endpoint URL. Defaults to the local `/mock-data.json` endpoint.
 */
export async function fetchLocations(url?: string): Promise<LocationPoint[]> {
  // Add a configurable artificial delay of 800ms to demonstrate the responsive loading skeletons.
  await new Promise((resolve) => setTimeout(resolve, 800));

  const targetUrl = url || '/mock-data.json';

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as LocationPoint[];
  } catch (error) {
    console.warn(`Fetch to "${targetUrl}" failed. Attempting fallback to "/mock-data.json"...`, error);

    // If we were trying a custom remote URL, fallback to local file
    if (targetUrl !== '/mock-data.json') {
      try {
        const fallbackResponse = await fetch('/mock-data.json');
        if (!fallbackResponse.ok) {
          throw new Error('Local fallback also failed');
        }
        return await fallbackResponse.json() as LocationPoint[];
      } catch (fbError) {
        throw new Error(`Failed to load points: ${(fbError as Error).message}`);
      }
    }
    
    throw error;
  }
}
