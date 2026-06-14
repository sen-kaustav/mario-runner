export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    let loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Loading High-Res Assets...',
      { font: "20px 'Fira Code'", fill: '#ffffff' },
    );
    loadingText.setOrigin(0.5);

    this.load.spritesheet(
      'player_run_sheet',
      'assets/player_image_running_sprite.png',
      {
        frameWidth: 345,
        frameHeight: 635,
      },
    );

    // --- GAME TITLE IMAGE ---
    this.load.image('game_title', 'assets/game_title.png');

    // --- DOG OBSTACLE SPRITESHEET ---
    this.load.spritesheet('dog_obstacle', 'assets/dog_obstacle_sprite.png', {
      frameWidth: 624,
      frameHeight: 422,
    });

    // --- GENERATE HURDLE PIPES ---
    let pipeCanvas = document.createElement('canvas');
    pipeCanvas.width = 32;
    pipeCanvas.height = 64;
    let ctx2 = pipeCanvas.getContext('2d');
    ctx2.fillStyle = '#00a800';
    ctx2.fillRect(0, 0, 32, 64);
    ctx2.fillStyle = '#b8f818';
    ctx2.fillRect(4, 0, 4, 64);
    ctx2.strokeStyle = '#000000';
    ctx2.lineWidth = 2;
    ctx2.strokeRect(0, 0, 32, 64);
    this.textures.addCanvas('obstacle_pipe', pipeCanvas);

    // --- GENERATE GROUND BLOCK ---
    let groundCanvas = document.createElement('canvas');
    groundCanvas.width = 32;
    groundCanvas.height = 32;
    let ctx3 = groundCanvas.getContext('2d');
    ctx3.fillStyle = '#c84c0c';
    ctx3.fillRect(0, 0, 32, 32);
    ctx3.strokeStyle = '#fc9c5c';
    ctx3.lineWidth = 1;
    ctx3.strokeRect(0, 0, 32, 32);
    this.textures.addCanvas('ground_block', groundCanvas);
  }

  create() {
    // Wait for Fira Code to actually load before rendering gameplay text,
    // otherwise Phaser canvas text falls back to the default system font.
    document.fonts.load('1em "Fira Code"').then(() => {
      this.scene.start('GameScene');
    });
  }
}
