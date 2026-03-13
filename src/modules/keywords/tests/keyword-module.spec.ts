import { RegionCode } from '@prisma/client';
import { KeywordDebugService } from '../keyword-debug.service';
import { KeywordExtractionService } from '../keyword-extraction.service';
import { KeywordFilterService } from '../keyword-filter.service';
import { KeywordNormalizerService } from '../keyword-normalizer.service';

describe('Roblox keyword extraction module', () => {
  const keywordRepository = {
    getHistoricalStat: jest.fn().mockResolvedValue(null),
  };

  const normalizer = new KeywordNormalizerService();
  const extraction = new KeywordExtractionService(normalizer);
  const filter = new KeywordFilterService(keywordRepository as any);
  const debug = new KeywordDebugService(extraction, filter);

  beforeEach(() => {
    jest.clearAllMocks();
    keywordRepository.getHistoricalStat.mockResolvedValue(null);
  });

  it('cleanTitle removes emoji and noisy punctuation', () => {
    expect(
      normalizer.cleanTitle('🔥 NEW Grow Garden Simulator UPDATE!! (Roblox)'),
    ).toBe('NEW Grow Garden Simulator UPDATE Roblox');
  });

  it('extracts Grow Garden Simulator', async () => {
    const result = await debug.debugExtract({
      title: '🔥 NEW Grow Garden Simulator UPDATE!! (Roblox)',
      region: RegionCode.US,
    });

    expect(result.candidates.some((item) => item.displayName === 'Grow Garden Simulator')).toBe(
      true,
    );
  });

  it('extracts Anime Saga', async () => {
    const result = await debug.debugExtract({
      title: 'Anime Saga Just Released',
      region: RegionCode.US,
    });

    expect(result.candidates.some((item) => item.displayName === 'Anime Saga')).toBe(true);
  });

  it('extracts Grow Garden Simulator from best codes title', async () => {
    const result = await debug.debugExtract({
      title: 'Best Codes In Grow Garden Simulator',
      region: RegionCode.US,
    });

    expect(result.candidates.some((item) => item.displayName === 'Grow Garden Simulator')).toBe(
      true,
    );
  });

  it('extracts Azure Latch', async () => {
    const result = await debug.debugExtract({
      title: 'I Played Azure Latch For The First Time',
      region: RegionCode.US,
    });

    expect(result.candidates.some((item) => item.displayName === 'Azure Latch')).toBe(true);
  });

  it('extracts Bubble Gum Simulator Infinity', async () => {
    const result = await debug.debugExtract({
      title: 'Bubble Gum Simulator Infinity Is Back',
      region: RegionCode.US,
    });

    expect(
      result.candidates.some((item) => item.displayName === 'Bubble Gum Simulator Infinity'),
    ).toBe(true);
  });

  it('rejects Best Roblox Simulator Games as generic', async () => {
    const result = await debug.debugExtract({
      title: 'Best Roblox Simulator Games',
      region: RegionCode.US,
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.rejected.some((item) => item.reason === 'generic_only')).toBe(true);
  });

  it('rejects New Roblox Game Update as generic or stopword only', async () => {
    const result = await debug.debugExtract({
      title: 'New Roblox Game Update',
      region: RegionCode.US,
    });

    expect(result.candidates).toHaveLength(0);
    expect(
      result.rejected.some((item) =>
        ['generic_only', 'stopword_only', 'noise_pattern'].includes(item.reason),
      ),
    ).toBe(true);
  });

  it('rejects Roblox Codes Update', async () => {
    const result = await debug.debugExtract({
      title: 'Roblox Codes Update',
      region: RegionCode.US,
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.rejected.some((item) => item.reason === 'generic_only')).toBe(true);
  });

  it('rejects Tycoon', async () => {
    const result = await debug.debugExtract({
      title: 'Tycoon',
      region: RegionCode.US,
    });

    expect(result.candidates).toHaveLength(0);
    expect(
      result.rejected.some((item) => ['too_short', 'generic_only'].includes(item.reason)),
    ).toBe(true);
  });

  it('rejects emoji-only title', async () => {
    const result = await debug.debugExtract({
      title: '🔥🔥🔥',
      region: RegionCode.US,
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.rejected.some((item) => item.reason === 'noise_pattern')).toBe(true);
  });

  it('flags legacy keyword when historical stats exceed threshold', async () => {
    keywordRepository.getHistoricalStat.mockResolvedValue({
      total_mentions_90d: 21,
      is_legacy_keyword: false,
    });

    const candidates = extraction.extractCandidateKeywordsFromTitle('Anime Saga Just Released');
    const animeSaga = candidates.find((item) => item.displayName === 'Anime Saga');
    expect(animeSaga).toBeDefined();

    const result = await filter.filterKeyword(animeSaga!, { region: RegionCode.US });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('legacy_keyword');
  });
});
