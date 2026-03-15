export const GENERIC_KEYWORDS = [
  'simulator',
  'tycoon',
  'tower defense',
  'obby',
  'rng',
  'clicker',
  'game',
  'update',
  'codes',
  'code',
  'guide',
  'wiki',
  'roblox',
] as const;

export const DISCOVERY_CONFIG = {
  youtube: {
    queries: [
      'roblox new game',
      'roblox tycoon',
      'roblox simulator',
    ],
    hoursWindow: 72,
    maxVideosPerQuery: 5,
    maxRawVideosTotal: 50,
  },
  extraction: {
    maxCandidatesPerTitle: 2,
    maxRawCandidatesTotal: 60,
  },
  filtering: {
    maxAcceptedNewWords: 20,
    dashboardTopLimit: 10,
    trendsPageSize: 20,
  },
} as const;
