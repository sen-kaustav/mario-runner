export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    let loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Loading High-Res Assets...',
      { font: '30px "Fira Code", monospace', fill: '#ffffff' },
    );
    loadingText.setOrigin(0.5);

    // FIXED: Pointing to the correct .png extension
    this.load.spritesheet(
      'player_run_sheet',
      'assets/player_image_running_sprite.png',
      {
        frameWidth: 345,
        frameHeight: 635,
      },
    );

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

    // --- GENERATE ROLLING BALL ---
    let ballCanvas = document.createElement('canvas');
    ballCanvas.width = 32;
    ballCanvas.height = 32;
    let ctxBall = ballCanvas.getContext('2d');
    ctxBall.beginPath();
    ctxBall.arc(16, 16, 15, 0, Math.PI * 2);
    ctxBall.fillStyle = '#fc9c5c';
    ctxBall.fill();
    ctxBall.beginPath();
    ctxBall.moveTo(16, 16);
    ctxBall.arc(16, 16, 15, 0, Math.PI / 2);
    ctxBall.fillStyle = '#fc2000';
    ctxBall.fill();
    ctxBall.beginPath();
    ctxBall.moveTo(16, 16);
    ctxBall.arc(16, 16, 15, Math.PI, Math.PI * 1.5);
    ctxBall.fillStyle = '#0020b8';
    ctxBall.fill();
    ctxBall.beginPath();
    ctxBall.arc(16, 16, 15, 0, Math.PI * 2);
    ctxBall.strokeStyle = '#000000';
    ctxBall.lineWidth = 2;
    ctxBall.stroke();
    this.textures.addCanvas('obstacle_ball', ballCanvas);

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
    // Wait for the Google Font to actually load before rendering gameplay text,
    // otherwise Phaser canvas text falls back to the default system font.
    Promise.all([
      document.fonts.load('1em "Fira Code"'),
      document.fonts.load('1em "Fira Mono"'),
    ]).then(() => {
      this.scene.start('GameScene');
    });
  }
}
