import { describe, expect, it } from 'vitest';
import { EVOLUTION_STAGE_IDS, MOOD_IDS } from '../../domain';
import { MOOD_FACE, STAGE_PALETTE, STAGE_POSE } from './pose';

describe('huffling pose', () => {
  it('defines a pose and palette for every stage and a face for every mood', () => {
    for (const stage of EVOLUTION_STAGE_IDS) {
      expect(STAGE_POSE[stage]).toBeDefined();
      expect(STAGE_PALETTE[stage]).toBeDefined();
    }
    for (const mood of MOOD_IDS) {
      expect(MOOD_FACE[mood]).toBeDefined();
    }
  });

  it('stands taller and straighter at each stage', () => {
    const poses = EVOLUTION_STAGE_IDS.map((stage) => STAGE_POSE[stage]);
    for (let i = 1; i < poses.length; i += 1) {
      expect(poses[i].bodyRy).toBeGreaterThan(poses[i - 1].bodyRy);
      expect(poses[i].bodyRx).toBeLessThan(poses[i - 1].bodyRx);
      expect(poses[i].lean).toBeLessThanOrEqual(poses[i - 1].lean);
      expect(poses[i].earDroop).toBeLessThan(poses[i - 1].earDroop);
      expect(poses[i].armSpread).toBeGreaterThan(poses[i - 1].armSpread);
    }
  });

  it('keeps every body inside the 200x200 viewBox with room for feet', () => {
    for (const stage of EVOLUTION_STAGE_IDS) {
      const { bodyCy, bodyRy, bodyRx } = STAGE_POSE[stage];
      expect(bodyCy - bodyRy).toBeGreaterThan(30);
      expect(bodyCy + bodyRy).toBeLessThanOrEqual(170);
      expect(100 - bodyRx).toBeGreaterThan(20);
    }
  });

  it('only the final stage glows', () => {
    const glowing = EVOLUTION_STAGE_IDS.filter((stage) => STAGE_POSE[stage].aura);
    expect(glowing).toEqual(['thriving']);
  });

  it('shows strain when winded and sparkle only when energized', () => {
    expect(MOOD_FACE.winded.sweat && MOOD_FACE.winded.puffs).toBe(true);
    expect(MOOD_FACE.energized.sparkles).toBe(true);
    expect(MOOD_FACE.neutral.sweat || MOOD_FACE.neutral.sparkles).toBe(false);
  });

  it('uses valid hex colours', () => {
    for (const stage of EVOLUTION_STAGE_IDS) {
      for (const value of Object.values(STAGE_PALETTE[stage])) {
        expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});
