// Animation state machine for the desktop pet
// Controls animation states and produces FrameData for the renderer

import { ColorGrid, CHARACTERS, CharacterDef, parseMap } from '../shared/pixelMaps';
import { FrameData } from './renderer';

export type AnimationState = 'idle' | 'walk' | 'sit' | 'talk';

export class AnimationController {
  public currentState: AnimationState = 'idle';
  public character: CharacterDef;
  private baseMap: ColorGrid;

  // Timing
  private elapsed: number = 0;
  private stateTimer: number = 0;
  private idleTimer: number = 0;
  private frameIndex: number = 0;

  // Bob parameters
  private bobAmplitude: number = 2;  // pixels
  private bobPeriod: number = 2000;  // ms

  // Walk parameters
  private walkFrames: ColorGrid[] = [];
  private walkFrameInterval: number = 300;
  private walkTimer: number = 0;

  // Talk parameters
  private talkFrames: ColorGrid[] = [];
  private talkFrameInterval: number = 180;
  private talkTimer: number = 0;

  // Sit threshold
  private sitThreshold: number = 30000; // 30 seconds idle -> sit

  // Callbacks
  public onSitDown?: () => void;

  constructor(characterId: number = 0) {
    const char = CHARACTERS.find(c => c.id === characterId);
    this.character = char || CHARACTERS[0];
    this.baseMap = this.cloneGrid(this.character.map);
    this.generateWalkFrames();
    this.generateTalkFrames();
  }

  setCharacter(characterId: number) {
    const char = CHARACTERS.find(c => c.id === characterId);
    if (!char) return;
    this.character = char;
    this.baseMap = this.cloneGrid(char.map);
    this.generateWalkFrames();
    this.generateTalkFrames();
  }

  setState(state: AnimationState) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateTimer = 0;
    this.frameIndex = 0;
    this.walkTimer = 0;
    this.talkTimer = 0;
  }

  /** Called every frame with delta time in ms */
  tick(deltaMs: number): FrameData {
    this.elapsed += deltaMs;
    this.stateTimer += deltaMs;

    switch (this.currentState) {
      case 'idle':
        return this.tickIdle(deltaMs);
      case 'walk':
        return this.tickWalk(deltaMs);
      case 'sit':
        return this.tickSit(deltaMs);
      case 'talk':
        return this.tickTalk(deltaMs);
      default:
        return this.tickIdle(deltaMs);
    }
  }

  /** Notify that user interaction happened; resets idle timer */
  notifyInteraction() {
    this.idleTimer = 0;
    if (this.currentState === 'sit') {
      this.setState('idle');
    }
  }

  private tickIdle(deltaMs: number): FrameData {
    this.idleTimer += deltaMs;

    // Auto-transition to sit after long idle
    if (this.idleTimer >= this.sitThreshold && this.currentState === 'idle') {
      this.setState('sit');
      this.onSitDown?.();
      return this.tickSit(deltaMs);
    }

    // Sine-based vertical bob
    const bobY = Math.sin(this.elapsed * 2 * Math.PI / this.bobPeriod) * this.bobAmplitude;

    return {
      grid: this.baseMap,
      offsetX: 0,
      offsetY: bobY,
    };
  }

  private tickWalk(deltaMs: number): FrameData {
    this.walkTimer += deltaMs;
    if (this.walkTimer >= this.walkFrameInterval) {
      this.walkTimer -= this.walkFrameInterval;
      this.frameIndex = (this.frameIndex + 1) % this.walkFrames.length;
    }

    // Slight horizontal bob while walking
    const bobX = Math.sin(this.elapsed * Math.PI / 150) * 1;

    return {
      grid: this.walkFrames[this.frameIndex] || this.baseMap,
      offsetX: bobX,
      offsetY: 0,
    };
  }

  private tickSit(_deltaMs: number): FrameData {
    // Sitting: very subtle slower breathing
    const bobY = Math.sin(this.elapsed * Math.PI / 3000) * 0.5;

    // Generate sit frame procedurally: compress lower body
    return {
      grid: this.getSitGrid(),
      offsetX: 0,
      offsetY: bobY,
    };
  }

  private tickTalk(deltaMs: number): FrameData {
    this.talkTimer += deltaMs;
    if (this.talkTimer >= this.talkFrameInterval) {
      this.talkTimer -= this.talkFrameInterval;
      this.frameIndex = (this.frameIndex + 1) % this.talkFrames.length;
    }

    // Gentle bob while talking
    const bobY = Math.sin(this.elapsed * 2 * Math.PI / 2000) * 0.8;

    return {
      grid: this.talkFrames[this.frameIndex] || this.baseMap,
      offsetX: 0,
      offsetY: bobY,
    };
  }

  // ── Frame Generation ──

  /** Generate walk frames by modifying the lower body rows */
  private generateWalkFrames() {
    this.walkFrames = [
      this.baseMap, // frame 0: neutral
      this.modifyLegs(this.baseMap, true),  // left leg forward
      this.baseMap, // frame 2: neutral again
      this.modifyLegs(this.baseMap, false), // right leg forward
    ];
  }

  private modifyLegs(grid: ColorGrid, leftForward: boolean): ColorGrid {
    const clone = this.cloneGrid(grid);
    // Modify rows 25-31 to simulate leg movement
    // This is a simplified approach; each character's lower body differs
    // We swap the bottom 3 rows to suggest leg movement
    for (let y = 25; y < 32; y++) {
      const row = clone[y];
      if (!row || row.length < 32) continue;
      for (let x = 0; x < 32; x++) {
        if (leftForward) {
          // Shift left-side pixels down by 1
          if (x < 16 && y < 31) {
            clone[y + 1]![x] = row[x];
            if (y === 25) clone[y]![x] = null;
          }
        } else {
          // Shift right-side pixels down by 1
          if (x >= 16 && y < 31) {
            clone[y + 1]![x] = row[x];
            if (y === 25) clone[y]![x] = null;
          }
        }
      }
    }
    return clone;
  }

  /** Generate talk frames: different mouth shapes */
  private generateTalkFrames() {
    this.talkFrames = [
      this.baseMap,                              // closed mouth
      this.modifyMouth(this.baseMap, 'half'),     // half open
      this.modifyMouth(this.baseMap, 'open'),     // fully open
      this.modifyMouth(this.baseMap, 'half'),     // half open
    ];
  }

  private modifyMouth(grid: ColorGrid, state: 'half' | 'open'): ColorGrid {
    const clone = this.cloneGrid(grid);
    // Mouth is around rows 15-17 (varies by character), column ~16
    // We identify the mouth by finding 'M' (red mouth) or dark pixels in face area

    const mouthColor = '#e94560'; // red mouth
    const blackColor = '#1a1a1a';

    for (let y = 14; y < 19; y++) {
      const row = clone[y];
      if (!row) continue;
      for (let x = 12; x < 20; x++) {
        const pixel = row[x];
        if (pixel === mouthColor || (pixel === blackColor && y >= 16)) {
          // Expand mouth shape
          if (state === 'half') {
            // 2-pixel tall mouth
            if (y === 16 && x >= 14 && x <= 17) row[x] = blackColor;
            if (y === 17 && x === 15) row[x] = mouthColor;
          } else if (state === 'open') {
            // 3-pixel tall oval mouth
            if (y === 15 && x >= 14 && x <= 17) row[x] = blackColor;
            if (y === 16 && x >= 13 && x <= 17) row[x] = mouthColor;
            if (y === 17 && x >= 14 && x <= 16) row[x] = blackColor;
          }
        }
      }
    }
    return clone;
  }

  /** Generate sit grid: compress lower body into fewer rows */
  private getSitGrid(): ColorGrid {
    const clone = this.cloneGrid(this.baseMap);

    // For sitting: widen the stance, compress vertical
    // Take rows 20-31 and compress into rows 24-31
    const newRows: (string | null)[][] = Array.from({ length: 32 }, (_, i) => {
      if (i < 20) return [...(this.baseMap[i] || [])];
      return Array(32).fill(null);
    });

    // Simple compression: take lower body pixels and move them down+out
    for (let y = 20; y < 32; y++) {
      const srcRow = this.baseMap[y];
      if (!srcRow) continue;
      const targetY = Math.min(31, 24 + Math.floor((y - 20) * 0.6));
      const targetRow = newRows[targetY]!;
      for (let x = 0; x < 32; x++) {
        const color = srcRow[x];
        if (!color) continue;
        // Spread outward slightly
        const offsetX = x < 16 ? -2 : 2;
        const targetX = Math.max(0, Math.min(31, x + offsetX));
        targetRow[targetX] = color;
      }
    }

    return newRows;
  }

  // ── Helpers ──

  private cloneGrid(grid: ColorGrid): ColorGrid {
    return grid.map(row => row ? [...row] : []);
  }
}
