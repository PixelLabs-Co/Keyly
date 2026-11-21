// Google Places (New) autocomplete. Needs VITE_GOOGLE_MAPS_API_KEY; without it the address field is a plain input.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
export const placesEnabled = Boolean(KEY)

/* eslint-disable @typescript-eslint/no-explicit-any */
let loading: Promise<any> | null = null

export function loadPlaces(): Promise<any> {
  if (!KEY) return Promise.reject(new Error('No Google Maps key'))
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const w = window as any
      if (w.google?.maps?.importLibrary) return resolve(w.google.maps.importLibrary('places'))
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&loading=async&v=weekly`
      s.async = true
      s.onload = () => resolve(w.google.maps.importLibrary('places'))
      s.onerror = () => { loading = null; reject(new Error('Could not load Google Maps')) }
      document.head.appendChild(s)
    })
  }
  return loading
}

export type Suggestion = { text: string; main: string; secondary: string }

export async function suggestAddresses(input: string, token: unknown): Promise<Suggestion[]> {
  const lib = await loadPlaces()
  const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    sessionToken: token,
    includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
    includedRegionCodes: ['us'],
  })
  return suggestions.map((s: any) => ({
    text: s.placePrediction.text.toString(),
    main: s.placePrediction.mainText?.toString() ?? s.placePrediction.text.toString(),
    secondary: s.placePrediction.secondaryText?.toString() ?? '',
  }))
}

export async function newSessionToken(): Promise<unknown> {
  const lib = await loadPlaces()
  return new lib.AutocompleteSessionToken()
}
