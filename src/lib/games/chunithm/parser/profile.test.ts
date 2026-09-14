import { describe, expect, it } from 'bun:test';

import { ParseError } from '@/lib/errors';
import { parseActiveCollection, parseProfile } from '@/lib/games/chunithm/parser/profile';

const FULL_PROFILE_HTML = `
<div class="box_playerprofile" style="background-image:url(https://chunithm-net-eng.com/mobile/images/profile_normal.png)">
  <div class="player_data_left">
    <div class="player_chara" style="background-image:url(https://chunithm-net-eng.com/mobile/images/charaframe_silver.png)">
      <img src="https://chunithm-net-eng.com/mobile/img/2c20c7ac326c1a9d.png" />
    </div>
  </div>
  <div class="player_data_right">
    <div class="player_team_emblem_normal"></div>
    <div class="player_team_data">
      <div class="player_team_name font_x-small">CHUNITHM Flexible</div>
    </div>
    <div class="player_honor_block">
      <div class="player_honor_short" style="background-image:url(https://chunithm-net-eng.com/mobile/images/honor_bg_silver.png)">
        <div class="player_honor_text_view">
          <div class="player_honor_text"><span>ネコぱら</span></div>
        </div>
      </div>
      <div class="player_honor_short" style="background-image:url(https://chunithm-net-eng.com/mobile/img/049c5d05b8663359.png)">
        <div></div>
      </div>
      <div class="player_honor_short">
        <div></div>
      </div>
    </div>
    <div class="player_name">
      <div class="player_lv">11</div>
      <div class="player_reborn">2</div>
      <div class="player_name_in">PlayerOne</div>
    </div>
    <div class="player_rating">
      <div class="player_rating_num_block">
        <img src="https://chunithm-net-eng.com/mobile/images/rating/rating_gold_01.png" />
        <img src="https://chunithm-net-eng.com/mobile/images/rating/rating_gold_05.png" />
        <div class="player_rating_comma">
          <img src="https://chunithm-net-eng.com/mobile/images/rating/rating_gold_comma.png" />
        </div>
        <img src="https://chunithm-net-eng.com/mobile/images/rating/rating_gold_01.png" />
        <img src="https://chunithm-net-eng.com/mobile/images/rating/rating_gold_00.png" />
      </div>
      <div class="player_rating_max">15.13</div>
    </div>
    <div class="player_overpower">
      <div class="player_overpower_text">4878.18 (5.68%)</div>
    </div>
  </div>
</div>
<div class="w420 box01">
  <div class="user_data_friend_code">
    <div class="user_data_text user_data_friend_tap">
      <span class="font_90">Show Friend Code</span>
      <span style="display:none;">1234567890123</span>
    </div>
  </div>
  <div class="user_data_point">
    <div class="user_data_text">133,500</div>
  </div>
  <div class="user_data_total_point">
    <div class="user_data_text">136,000</div>
  </div>
  <div class="user_data_current_play_count">
    <div class="user_data_text">25</div>
  </div>
  <div class="user_data_play_count">
    <div class="user_data_text">70</div>
  </div>
</div>
`;

describe('Chunithm parseProfile — happy path', () => {
  it('parses player name', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.name).toBe('PlayerOne');
  });

  it('parses friend code', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.friendCode).toBe('1234567890123');
  });

  it('parses level and reborn count', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.level).toBe(11);
    expect(profile.reborn).toBe(2);
  });

  it('parses numeric rating and highest rating', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.rating.value).toBe(15.1);
    expect(profile.rating.color).toBe('gold');
    expect(profile.rating.images).toEqual([
      'https://chunithm-net-eng.com/mobile/images/rating/rating_gold_01.png',
      'https://chunithm-net-eng.com/mobile/images/rating/rating_gold_05.png',
      'https://chunithm-net-eng.com/mobile/images/rating/rating_gold_comma.png',
      'https://chunithm-net-eng.com/mobile/images/rating/rating_gold_01.png',
      'https://chunithm-net-eng.com/mobile/images/rating/rating_gold_00.png',
    ]);
    expect(profile.highestRating).toBe(15.13);
  });

  it('parses overpower value and percentage', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.overpower?.value).toBe(4878.18);
    expect(profile.overpower?.percentage).toBe(5.68);
  });

  it('parses character image and frame URL', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.character?.image).toBe(
      'https://chunithm-net-eng.com/mobile/img/2c20c7ac326c1a9d.png'
    );
    expect(profile.character?.frame).toBe(
      'https://chunithm-net-eng.com/mobile/images/charaframe_silver.png'
    );
  });

  it('parses team name and emblem', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.team?.name).toBe('CHUNITHM Flexible');
    expect(profile.team?.emblem).toBe('normal');
    expect(profile.team?.emblemUrl).toBe(
      'https://chunithm-net-eng.com/mobile/images/team_bg_normal_mini.png'
    );
  });

  it('parses titles array', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.titles).toHaveLength(2);
    expect(profile.titles?.[0]).toEqual({
      value: 'ネコぱら',
      type: 'silver',
      typeUrl: 'https://chunithm-net-eng.com/mobile/images/honor_bg_silver.png',
    });
    expect(profile.titles?.[1]).toEqual({
      value: null,
      type: null,
      typeUrl: 'https://chunithm-net-eng.com/mobile/img/049c5d05b8663359.png',
    });
  });

  it('parses play count with current version and total', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.playCount?.versionPlayCount).toBe(25);
    expect(profile.playCount?.totalPlayCount).toBe(70);
  });

  it('parses currency', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.currency?.owned).toBe(133500);
    expect(profile.currency?.total).toBe(136000);
  });
});

describe('Chunithm parseProfile — fallbacks and relative URLs', () => {
  it('parses name and friend code from form if present', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_name">
          <div class="player_lv">5</div>
          <div class="player_name_in">
            <form>
              <a>LinkedPlayer</a>
              <input name="idx" value="9876543210" />
            </form>
          </div>
        </div>
        <div class="player_rating">
          <div class="player_rating_num_block">
            <img src="/mobile/images/rating/rating_silver_01.png" />
            <img src="/mobile/images/rating/rating_silver_02.png" />
          </div>
        </div>
      </div>
    `;
    const profile = parseProfile(html, 'intl');
    expect(profile.name).toBe('LinkedPlayer');
    expect(profile.friendCode).toBe('9876543210');
    expect(profile.rating.value).toBe(12);
    expect(profile.rating.color).toBe('silver');
    expect(profile.rating.images).toEqual([
      'https://chunithm-net-eng.com/mobile/images/rating/rating_silver_01.png',
      'https://chunithm-net-eng.com/mobile/images/rating/rating_silver_02.png',
    ]);
    expect(profile.reborn).toBe(0);
    expect(profile.highestRating).toBeNull();
    expect(profile.overpower).toBeNull();
    expect(profile.character).toBeNull();
    expect(profile.team).toBeNull();
    expect(profile.playCount).toBeNull();
    expect(profile.currency).toBeNull();
  });

  it('resolves relative character image and frame URLs', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_data_left">
          <div class="player_chara" style="background-image:url('/mobile/images/charaframe_gold.png')">
            <img src="/mobile/img/chara.png" />
          </div>
        </div>
        <div class="player_rating">
          <div class="player_rating_num_block">
            <img src="/mobile/images/rating/rating_silver_09.png" />
          </div>
        </div>
      </div>
    `;
    const profile = parseProfile(html, 'intl');
    expect(profile.character?.image).toBe('https://chunithm-net-eng.com/mobile/img/chara.png');
    expect(profile.character?.frame).toBe(
      'https://chunithm-net-eng.com/mobile/images/charaframe_gold.png'
    );
  });

  it('resolves inline team emblem URL when specified in style', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_team_emblem_gold" style="background-image:url('/mobile/images/custom_emblem.png')"></div>
        <div class="player_team_data">
          <div class="player_team_name">GoldTeam</div>
        </div>
        <div class="player_rating">
          <div class="player_rating_num_block">
            <img src="/mobile/images/rating/rating_silver_09.png" />
          </div>
        </div>
      </div>
    `;
    const profile = parseProfile(html, 'intl');
    expect(profile.team?.emblem).toBe('gold');
    expect(profile.team?.emblemUrl).toBe(
      'https://chunithm-net-eng.com/mobile/images/custom_emblem.png'
    );
  });

  it('parses play count when only total play count is present', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_rating">
          <div class="player_rating_num_block">
            <img src="/mobile/images/rating/rating_silver_01.png" />
          </div>
        </div>
      </div>
      <div class="user_data_play_count">
        <div class="user_data_text">42</div>
      </div>
    `;
    const profile = parseProfile(html, 'intl');
    expect(profile.playCount?.versionPlayCount).toBeNull();
    expect(profile.playCount?.totalPlayCount).toBe(42);
  });
});

describe('Chunithm parseProfile — error cases', () => {
  it('throws ParseError when .box_playerprofile is missing', () => {
    expect(() => parseProfile('<div>no block</div>', 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when rating images are missing', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_name_in">Player</div>
      </div>
    `;
    expect(() => parseProfile(html, 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when rating format is invalid', () => {
    const html = `
      <div class="box_playerprofile">
        <div class="player_rating">
          <div class="player_rating_num_block">
            <img src="/images/unknown.png" />
          </div>
        </div>
      </div>
    `;
    expect(() => parseProfile(html, 'intl')).toThrow(ParseError);
  });
});

describe('Chunithm parseActiveCollection', () => {
  it('returns the resolved absolute URL of the active nameplate', () => {
    const html = `
      <div class="box01 w420">
        <div class="nameplate_now">
          <img src="https://chunithm-net-eng.com/mobile/img/14c0bda1b8026041.png" />
        </div>
      </div>
    `;
    const nameplate = parseActiveCollection(html, 'intl');
    expect(nameplate).toBe('https://chunithm-net-eng.com/mobile/img/14c0bda1b8026041.png');
  });

  it('resolves relative nameplate URL', () => {
    const html = `
      <div class="box01 w420">
        <div class="nameplate_now">
          <img src="/mobile/img/14c0bda1b8026041.png" />
        </div>
      </div>
    `;
    const nameplate = parseActiveCollection(html, 'intl');
    expect(nameplate).toBe('https://chunithm-net-eng.com/mobile/img/14c0bda1b8026041.png');
  });

  it('throws ParseError when .nameplate_now container is missing', () => {
    expect(() => parseActiveCollection('<div>no collection</div>', 'intl')).toThrow(ParseError);
  });
});
