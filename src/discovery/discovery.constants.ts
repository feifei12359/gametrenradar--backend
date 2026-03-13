import { KeywordStage, RegionCode } from '@prisma/client';

export const DEFAULT_REGION = RegionCode.US;
export const DEFAULT_TIME_WINDOW = '72h';

export const TARGET_REGIONS: RegionCode[] = [
  RegionCode.US,
  RegionCode.CA,
  RegionCode.UK,
  RegionCode.AU,
  RegionCode.NZ,
  RegionCode.DE,
  RegionCode.NL,
  RegionCode.SE,
  RegionCode.NO,
  RegionCode.DK,
];

export const DISCOVERY_STAGE_ORDER: KeywordStage[] = [
  KeywordStage.NEW,
  KeywordStage.EARLY,
  KeywordStage.EXPLODING,
];

export const YOUTUBE_DISCOVERY_QUERIES = [
  'roblox new game',
  'roblox simulator',
  'roblox tycoon',
  'roblox codes',
  'roblox update',
  'roblox new release',
];

export const GENERIC_KEYWORD_PATTERNS = [
  'simulator',
  'tycoon',
  'tower defense',
  'obby',
  'rng',
  'clicker',
  'game',
  'update',
  'roblox',
  'codes',
  'guide',
  'wiki',
];
