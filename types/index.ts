export interface GuideRequest {
  destination: string;
  days: number;
  interests: string[];
  notes: string;
}

export interface Attraction {
  name: string;
  description: string;
  whyVisit: string;
}

export interface HiddenGem {
  name: string;
  description: string;
  howToFind: string;
}

export interface Story {
  title: string;
  narrative: string;
}

export interface HeritageItem {
  title: string;
  description: string;
}

export interface LocalEvent {
  name: string;
  description: string;
  typicalTiming: string;
}

export interface CulturalExperience {
  name: string;
  description: string;
  howToEngage: string;
}

export interface GuideResponse {
  destination: string;
  attractions: Attraction[];
  hiddenGems: HiddenGem[];
  story: Story;
  heritage: HeritageItem[];
  localEvents: LocalEvent[];
  culturalExperiences: CulturalExperience[];
}
