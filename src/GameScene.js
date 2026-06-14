export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.gameSpeed = 300;
    this.score = 0;
    this.isGameOver = false;
    this.nextObstacleDelay = 0;
    this.bottomOffset = 50;

    // Difficulty ramps with score and caps at score 400.
    this.pipeChance = 0.35;
    this.ballSpeedMultiplier = 1.2;
    this.DIFFICULTY_RAMP_SCORE = 400;
    this.MAX_PIPE_CHANCE = 0.65;
    this.MAX_BALL_MULTIPLIER = 1.7;

    this.highScore =
      parseInt(localStorage.getItem('mario_runner_highscore')) || 0;

    this.audioContext = null;
    this.audioLoopTimer = null;
    this.currentNoteIndex = 0;

    this.birthdayMelody = [
      { note: 'C4', freq: 261.63, duration: 0.5 },
      { note: 'C4', freq: 261.63, duration: 0.5 },
      { note: 'D4', freq: 293.66, duration: 1.0 },
      { note: 'C4', freq: 261.63, duration: 1.0 },
      { note: 'F4', freq: 349.23, duration: 1.0 },
      { note: 'E4', freq: 329.63, duration: 2.0 },
      { note: 'C4', freq: 261.63, duration: 0.5 },
      { note: 'C4', freq: 261.63, duration: 0.5 },
      { note: 'D4', freq: 293.66, duration: 1.0 },
      { note: 'C4', freq: 261.63, duration: 1.0 },
      { note: 'G4', freq: 392.0, duration: 1.0 },
      { note: 'F4', freq: 349.23, duration: 2.0 },
    ];
  }

  create() {
    const { width, height } = this.scale;

    // Sky background
    this.add.rectangle(0, 0, width, height, 0x5a86ee).setOrigin(0);
    this.add
      .rectangle(
        0,
        height - this.bottomOffset,
        width,
        this.bottomOffset,
        0x111111,
      )
      .setOrigin(0);

    // Repeating ground platform
    this.ground = this.add
      .tileSprite(0, height - 32 - this.bottomOffset, width, 32, 'ground_block')
      .setOrigin(0);
    this.physics.add.existing(this.ground, true);

    // Main Character - Positioned flush against the ground
    this.player = this.physics.add.sprite(
      80,
      height - 125 - this.bottomOffset,
      'player_run_sheet',
    );
    this.player.setCollideWorldBounds(true);

    // Downscale the high-res asset proportionally to fit nicely inside your screen layout
    this.player.setScale(0.18);

    // Adjust the physics body collision box bounds to match only the character area, ignoring empty margins
    if (this.player.body) {
      this.player.body.setSize(220, 580);
      this.player.body.setOffset(60, 55);
    }

    // --- ANIMATION TRACKS REGISTERED ---
    this.anims.create({
      key: 'player_run_loop',
      frames: this.anims.generateFrameNumbers('player_run_sheet', {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.player.play('player_run_loop');

    // Spawning pools
    this.obstacles = this.physics.add.group();

    // System Colliders
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.obstacles, this.ground);
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.handleGameOver,
      null,
      this,
    );

    // Mobile & Keyboard Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isMobileTapped = false;
    this.input.on('pointerdown', () => {
      this.isMobileTapped = true;
      this.initAudioContext();
    });

    // UI Displays
    this.scoreText = this.add
      .text(width / 2, 40, this.getScoreString(), {
        font: "20px 'Fira Code'",
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    this.gameOverText = this.add
      .text(width / 2, height / 2 - 40, 'GAME OVER\nTap to Try Again', {
        font: "20px 'Fira Code'",
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.nextObstacleDelay = Phaser.Math.Between(1200, 2200);
  }

  update(time, delta) {
    if (this.isGameOver) {
      if (
        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        this.isMobileTapped
      ) {
        this.isMobileTapped = false;
        this.stopMusic();
        this.scene.restart();
      }
      return;
    }

    this.ground.tilePositionX += this.gameSpeed * (delta / 1000);

    const isJumpActive =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      this.isMobileTapped;
    if (isJumpActive && this.player.body && this.player.body.touching.down) {
      this.player.setVelocityY(-720);
      this.playJumpNote();

      this.player.anims.stop();
      this.player.setFrame(2); // Mid-stride jump frame pose lock
    }
    this.isMobileTapped = false;

    if (
      this.player.body &&
      this.player.body.touching.down &&
      !this.player.anims.isPlaying
    ) {
      this.player.play('player_run_loop');
    }

    this.score += 0.1;
    const currentScoreFloor = Math.floor(this.score);
    if (currentScoreFloor > this.highScore) {
      this.highScore = currentScoreFloor;
    }
    this.scoreText.setText(this.getScoreString());

    // Ramp difficulty with score: balls get faster and pipes spawn more often.
    const progress = Math.min(
      currentScoreFloor / this.DIFFICULTY_RAMP_SCORE,
      1,
    );
    this.ballSpeedMultiplier =
      1.2 + progress * (this.MAX_BALL_MULTIPLIER - 1.2);
    this.pipeChance = 0.35 + progress * (this.MAX_PIPE_CHANCE - 0.35);

    this.gameSpeed += 6.0 * (delta / 1000);

    if (this.player.anims && this.player.anims.isPlaying) {
      const speedRatio = this.gameSpeed / 300;
      this.player.anims.timeScale = Math.min(2.2, speedRatio);
    }

    this.nextObstacleDelay -= delta;
    if (this.nextObstacleDelay <= 0) {
      this.spawnObstacle();
      const minDelay = Math.max(600, 1400 - (this.gameSpeed - 300) * 1.6);
      const maxDelay = Math.max(1100, 2600 - (this.gameSpeed - 300) * 1.6);
      this.nextObstacleDelay = Phaser.Math.Between(minDelay, maxDelay);
    }

    this.obstacles.getChildren().forEach((obstacle) => {
      if (obstacle.x < -60) {
        obstacle.destroy();
      }
    });
  }

  getScoreString() {
    return `SCORE: ${Math.floor(this.score)}  HI: ${this.highScore}`;
  }

  spawnObstacle() {
    const { width, height } = this.scale;
    const chooseBall = Phaser.Math.RND.frac() > this.pipeChance;
    let obstacle;

    if (chooseBall) {
      const ballY = height - this.bottomOffset - 32 - 16;
      obstacle = this.obstacles.create(width + 20, ballY, 'obstacle_ball');
      obstacle.setOrigin(0.5);

      if (obstacle.body) {
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.setVelocityX(-(this.gameSpeed * this.ballSpeedMultiplier));
        obstacle.setAngularVelocity(-360);
      }
    } else {
      obstacle = this.obstacles.create(
        width + 20,
        height - 64 - this.bottomOffset,
        'obstacle_pipe',
      );
      obstacle.setOrigin(0);

      if (obstacle.body) {
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.setVelocityX(-this.gameSpeed);
      }
    }
  }

  // --- AUDIO HANDLING ---
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      this.playNextNote();
    } else if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playNextNote() {
    if (this.isGameOver || !this.audioContext) return;
    const currentNote = this.birthdayMelody[this.currentNoteIndex];
    const duration =
      currentNote.duration *
      350 *
      Math.max(0.6, 1.0 - (this.gameSpeed - 300) / 600);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.value = currentNote.freq;
    gain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + duration / 1000 - 0.03,
    );
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration / 1000);
    this.currentNoteIndex =
      (this.currentNoteIndex + 1) % this.birthdayMelody.length;
    this.audioLoopTimer = setTimeout(() => {
      this.playNextNote();
    }, duration);
  }

  playJumpNote() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(now + 0.16);
  }

  playSadNote() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const notes = [185.0, 146.83, 110.0];
    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      gain.gain.setValueAtTime(0.7, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.55);
    });
  }

  stopMusic() {
    if (this.audioLoopTimer) {
      clearTimeout(this.audioLoopTimer);
      this.audioLoopTimer = null;
    }
    this.currentNoteIndex = 0;
  }

  handleGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.player.anims.stop();
    this.player.setTint(0xff3333);
    this.gameOverText.setVisible(true);
    localStorage.setItem('mario_runner_highscore', this.highScore.toString());
    this.stopMusic();
    this.playSadNote();
  }
}
