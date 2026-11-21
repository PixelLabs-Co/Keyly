// Google Places API (New) autocomplete, called directly over HTTPS.
// Needs VITE_GOOGLE_MAPS_API_KEY with "Places API (New)" enabled; without it the address field is a plain input.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
export const placesEnabled = Boolean(KEY)

export type Suggestion = { text: string; main: string; secondary: string }

/** A session token groups keystrokes + the final pick into one billed session. */
export const newSessionToken = (): string => crypto.randomUUID()

export async function suggestAddresses(input: string, sessionToken: string): Promise<Suggestion[]> {
  if (!KEY) return []
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify({
      input,
      sessionToken,
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
      includedRegionCodes: ['us'],
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    console.warn('Address suggestions unavailable:', body?.error?.message ?? res.status)
    return []
  }
  const data = await res.json()
  return (data.suggestions ?? [])
    .filter((s: { placePrediction?: unknown }) => s.placePrediction)
    .map((s: { placePrediction: { text: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }) => ({
      text: s.placePrediction.text.text,
      main: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text.text,
      secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
    }))
}
