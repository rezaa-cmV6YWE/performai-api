import { describe, expect, it } from 'bun:test';

import { getChainImageUrl, getComboImageUrl, getJacketUrl } from '@/lib/games/chunithm/assets';

describe('Chunithm assets', () => {
  describe('getJacketUrl', () => {
    it('returns formatted jacket URL', () => {
      expect(getJacketUrl('abc.jpg')).toBe('https://chunithm-net-eng.com/mobile/img/abc.jpg');
    });

    it('returns null when image is empty or undefined', () => {
      expect(getJacketUrl(undefined)).toBeNull();
      expect(getJacketUrl(null)).toBeNull();
      expect(getJacketUrl('')).toBeNull();
    });
  });

  describe('getComboImageUrl', () => {
    it('returns correct URL for each combo type', () => {
      expect(getComboImageUrl('fc')).toBe(
        'https://chunithm-net-eng.com/mobile/images/icon_fullcombo.png'
      );
      expect(getComboImageUrl('aj')).toBe(
        'https://chunithm-net-eng.com/mobile/images/icon_alljustice.png'
      );
      expect(getComboImageUrl('ajc')).toBe(
        'https://chunithm-net-eng.com/mobile/images/icon_alljusticecritical.png'
      );
    });

    it('returns null for none or unknown combo types', () => {
      expect(getComboImageUrl(null)).toBeNull();
      expect(getComboImageUrl(undefined)).toBeNull();
      expect(getComboImageUrl('unknown')).toBeNull();
    });
  });

  describe('getChainImageUrl', () => {
    it('returns correct URL for each chain type', () => {
      expect(getChainImageUrl('fch')).toBe(
        'https://chunithm-net-eng.com/mobile/images/icon_fullchain2.png'
      );
      expect(getChainImageUrl('fch+')).toBe(
        'https://chunithm-net-eng.com/mobile/images/icon_fullchain.png'
      );
    });

    it('returns null for none or unknown chain types', () => {
      expect(getChainImageUrl(null)).toBeNull();
      expect(getChainImageUrl(undefined)).toBeNull();
      expect(getChainImageUrl('unknown')).toBeNull();
    });
  });
});
