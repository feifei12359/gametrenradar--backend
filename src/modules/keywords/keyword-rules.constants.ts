import { RegionCode } from '@prisma/client';

export const KEYWORD_STOP_WORDS = [
  'roblox',
  'new',
  'best',
  'insane',
  'crazy',
  'update',
  'updates',
  'codes',
  'code',
  'game',
  'games',
  'guide',
  'wiki',
  'release',
  'released',
  'gameplay',
  'playing',
  'played',
  'this',
  'that',
  'is',
  'are',
  'in',
  'on',
  'for',
  'with',
  'to',
  'the',
  'a',
  'an',
  'my',
  'our',
  'your',
  'just',
  'first',
  'time',
  'back',
];

export const KEYWORD_GENERIC_BLACKLIST = [
  'simulator',
  'tycoon',
  'tower defense',
  'obby',
  'rng',
  'clicker',
  'game',
  'update',
  'code',
  'codes',
  'guide',
  'wiki',
  'roblox',
];

export const KEYWORD_GENERIC_SINGLE_TOKENS = new Set(
  KEYWORD_GENERIC_BLACKLIST.filter((term) => !term.includes(' ')),
);

export const KEYWORD_ALLOWED_SUFFIXES = new Set([
  'simulator',
  'tycoon',
  'rng',
  'clicker',
  'infinity',
  'legends',
]);

export const KEYWORD_NOISE_PATTERNS = [
  /^\d+$/,
  /^[a-z]$/,
  /^(free|working)\s+codes?$/i,
  /^(roblox\s+)?codes?\s+update$/i,
  /^(new\s+)?roblox\s+game(\s+update)?$/i,
];

export const KEYWORD_SOURCE_CONTEXT_TERMS = [
  'roblox new game',
  'roblox simulator',
  'roblox tycoon',
  'roblox codes',
  'roblox update',
  'roblox new release',
];

export const KEYWORD_REGION_DEFAULT = RegionCode.US;
