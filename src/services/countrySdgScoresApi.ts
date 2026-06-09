import {
  fetchCountrySdgScores,
  type FetchCountrySdgScoresResponse,
} from "./sdgScoresApi";

export async function fetchCountrySdgScoresApi(
  countryNameOrCode: string,
  year?: number
): Promise<FetchCountrySdgScoresResponse> {
  return fetchCountrySdgScores(countryNameOrCode, year);
}

export default fetchCountrySdgScoresApi;