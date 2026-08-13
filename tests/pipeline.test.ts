import assert from 'node:assert';
import { test, describe } from 'node:test';
import { Frame, Character, Environment } from '../app/projects/[id]/types';

describe('Vivid Data Model & Pipeline Structs', () => {
  test('validates Frame structure with dialogue and camera motion', () => {
    const frame: Frame = {
      id: 'f-101',
      title: 'Shot 01 - Opening Office',
      timeRange: '00:00 - 00:05',
      image: 'https://storage.googleapis.com/vivid-488415/storyboard/sample.png',
      prompt: 'A detective staring out rainy window',
      scriptSegment: 'DETAILED SCRIPT LINE',
      shotAngle: 'Wide Shot',
      cameraMotion: 'Pan Left',
      dialogueSpeaker: 'DETECTIVE MILLER',
      dialogueText: 'This city never sleeps.',
      directorsBrief: {
        emotionalArc: 'Melancholic',
        lightingScheme: 'Low Key Venetian Blind',
        cameraLogic: 'Slow Pan Left',
        pacing: 'Slow',
      },
    };

    assert.strictEqual(frame.id, 'f-101');
    assert.strictEqual(frame.cameraMotion, 'Pan Left');
    assert.strictEqual(frame.dialogueSpeaker, 'DETECTIVE MILLER');
    assert.strictEqual(frame.shotAngle, 'Wide Shot');
  });

  test('validates Character multi-angle turnaround structure', () => {
    const char: Character = {
      id: 'char-1',
      name: 'Detective Miller',
      role: 'Protagonist',
      description: 'Weary detective in trench coat',
      image: 'https://storage.googleapis.com/vivid-488415/char-front.png',
      angles: {
        front: 'https://storage.googleapis.com/vivid-488415/char-front.png',
        profile: 'https://storage.googleapis.com/vivid-488415/char-profile.png',
      },
    };

    assert.strictEqual(char.name, 'Detective Miller');
    assert.ok(char.angles?.profile);
  });
});
