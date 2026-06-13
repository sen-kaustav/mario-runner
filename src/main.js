import { BootScene } from './BootScene.js';
import { GameScene } from './GameScene.js';

const config = {
  type: Phaser.AUTO,
  // Base logical resolution configured for Portrait aspect ratio (9:16)
  width: 450,
  height: 800,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1600 }, // Slightly heavier gravity for tight portrait spaces
      debug: false,
    },
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(config);
