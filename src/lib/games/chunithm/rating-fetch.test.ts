import { describe, expect, it } from 'bun:test';

import { fetchChunithmDifficultyLamps } from '@/lib/games/chunithm';
import type { chunithmFetch } from '@/lib/games/chunithm/http';

const MOCK_EXPERT_HTML = `
<div class="box01 w420">
  <form action="https://chunithm-net-eng.com/mobile/record/musicGenre/sendMusicDetail/" method="post">
    <div class="w388 musiclist_box bg_expert">
      <div class="text_white music_title">Aleph-0</div>
      <div class="play_musicdata_highscore">HIGH SCORE：<span class="text_b">1,005,037</span></div>
      <div class="play_musicdata_icon clearfix">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_fullcombo.png">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_fullchain2.png">
      </div>
      <input type="hidden" name="idx" value="428" />
      <input type="hidden" name="diff" value="2" />
    </div>
  </form>
</div>
`;

const MOCK_MASTER_HTML = `
<div class="box01 w420">
  <form action="https://chunithm-net-eng.com/mobile/record/musicGenre/sendMusicDetail/" method="post">
    <div class="w388 musiclist_box bg_master">
      <div class="text_white music_title">AXION</div>
      <div class="play_musicdata_highscore">HIGH SCORE：<span class="text_b">1,010,000</span></div>
      <div class="play_musicdata_icon clearfix">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_alljusticecritical.png">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_fullchain.png">
      </div>
      <input type="hidden" name="idx" value="863" />
      <input type="hidden" name="diff" value="3" />
    </div>
  </form>
</div>
`;

describe('fetchChunithmDifficultyLamps', () => {
  it('returns empty Map when token is empty or difficulties array is empty', async () => {
    const emptyTokenMap = await fetchChunithmDifficultyLamps(
      'https://chunithm-net-eng.com/mobile',
      '_t=token',
      '',
      ['expert']
    );
    expect(emptyTokenMap.size).toBe(0);

    const emptyDiffsMap = await fetchChunithmDifficultyLamps(
      'https://chunithm-net-eng.com/mobile',
      '_t=token',
      'valid_token',
      []
    );
    expect(emptyDiffsMap.size).toBe(0);
  });

  it('fetches difficulty pages and collects combo and chain lamps', async () => {
    const requestedUrls: string[] = [];
    const requestedBodies: string[] = [];

    const mockFetcher = (async (url: string, _cookie: string, init?: RequestInit) => {
      requestedUrls.push(url);
      requestedBodies.push(String(init?.body ?? ''));

      if (url.includes('sendExpert')) {
        return new Response(MOCK_EXPERT_HTML, { status: 200 });
      }
      if (url.includes('sendMaster')) {
        return new Response(MOCK_MASTER_HTML, { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    }) as unknown as typeof chunithmFetch;

    const lampsMap = await fetchChunithmDifficultyLamps(
      'https://chunithm-net-eng.com/mobile',
      '_t=my_token',
      'my_token',
      ['expert', 'master'],
      mockFetcher
    );

    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls).toContain(
      'https://chunithm-net-eng.com/mobile/record/musicGenre/sendExpert'
    );
    expect(requestedUrls).toContain(
      'https://chunithm-net-eng.com/mobile/record/musicGenre/sendMaster'
    );
    expect(requestedBodies[0]).toBe('genre=99&token=my_token');

    expect(lampsMap.get('428@expert')).toEqual({
      combo: 'fc',
      chain: 'fch',
    });

    expect(lampsMap.get('863@master')).toEqual({
      combo: 'ajc',
      chain: 'fch+',
    });
  });

  it('handles failed fetches gracefully without throwing', async () => {
    const failingFetcher = (async () => {
      throw new Error('Network error');
    }) as unknown as typeof chunithmFetch;

    const lampsMap = await fetchChunithmDifficultyLamps(
      'https://chunithm-net-eng.com/mobile',
      '_t=token',
      'valid_token',
      ['expert'],
      failingFetcher
    );

    expect(lampsMap.size).toBe(0);
  });
});
