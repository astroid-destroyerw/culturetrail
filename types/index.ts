export interface GuideRequest {
  destination: string;
  days: number;
  interests: string[];
  notes: string;
}

export interface ActivityDetail {
  activity: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
}

export interface DayItinerary {
  day: number;
  morning: ActivityDetail;
  afternoon: ActivityDetail;
  evening: ActivityDetail;
}

export interface GuideResponse {
  destination: string;
  days: DayItinerary[];
  wikiSummary?: string;
}
