// -------------------- 初期設定 --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// -------------------- 画像 --------------------
const playerImg = new Image(); playerImg.src = "img/player.png";
const bgImg     = new Image(); bgImg.src    = "img/background.jpg";
const beerImg   = new Image(); beerImg.src  = "img/beer.png";
const ladyImg   = new Image(); ladyImg.src  = "img/lady.png";

const titleCharImg = new Image(); titleCharImg.src = "img/title_character.png";
const titleLogoImg = new Image(); titleLogoImg.src = "img/title_logo.png";

let imagesToLoad = 2;  // タイトル画像だけカウント
let allImagesLoaded = false;

titleCharImg.onload = checkAllImagesLoaded;
titleLogoImg.onload = checkAllImagesLoaded;

function checkAllImagesLoaded() {
  imagesToLoad--;
  if (imagesToLoad === 0) {
    allImagesLoaded = true;
    draw();          // 初回描画
  }
}

// -------------------- 敵画像 --------------------
const enemyImages = {
  edamame:     new Image(),
  sashimi:     new Image(),
  yakitori:    new Image(),
  grilledfish: new Image(),
  ramen:       new Image()
};
enemyImages.edamame.src     = "img/edamame.png";
enemyImages.sashimi.src     = "img/sashimi.png";
enemyImages.yakitori.src    = "img/yakitori.png";
enemyImages.grilledfish.src = "img/grilledfish.png";
enemyImages.ramen.src       = "img/ramen.png";

// -------------------- ゲームデータ --------------------
const player = { x: 50, y: 250, width: 100, height: 100, speed: 5 };
const bullets = [], enemies = [], beers = [], ladies = [];

let score = 0, missedSnacks = 0;
let highScore = 0;
let isPoweredUp = false, isInvincible = false, invincibleTimer = 0, isGameOver = false;
let isTitleScreen = true;
let beerStreak = 0;
const keys = {};
let floatingTexts = [];


const enemyTypes = [
  { name: "edamame", speed: 2, score: 1 },
  { name: "sashimi", speed: 3, score: 2 },
  { name: "yakitori", speed: 4, score: 3 },
  { name: "grilledfish", speed: 5, score: 4 },
  { name: "ramen", speed: 7, score: 5 }
];
let boss = null;
let isBossActive = false;
let bossHp = 0;

const bossImg = new Image();
bossImg.src = "img/boss.png";  // ボス画像

// -------------------- ボタン設定 --------------------
const retryBtn = document.getElementById("retryBtn");
const titleBtn = document.getElementById("titleBtn");
retryBtn.style.display = "none";
titleBtn.style.display = "none";

// BGM ONボタンの位置調整関数（右下に配置）
function positionBgmToggleBtn() {
  const marginRight = 20;
  const marginBottom = 20;

  const canvasRect = canvas.getBoundingClientRect();
  bgmToggleBtn.style.left = (canvas.offsetLeft + canvas.width - marginRight - bgmToggleBtn.offsetWidth) + "px";
  bgmToggleBtn.style.top = (canvas.offsetTop + canvas.height - marginBottom - bgmToggleBtn.offsetHeight) + "px";
}

// 初期配置とリサイズ時に反映
window.addEventListener("load", positionBgmToggleBtn);
window.addEventListener("resize", positionBgmToggleBtn);
setTimeout(positionBgmToggleBtn, 100);

const startBtn = document.getElementById("startBtn");
startBtn.style.display = "block";

startBtn.addEventListener("click", () => {
  if (!allImagesLoaded) return;
  isTitleScreen = false;
  startBtn.style.display = "none";

  if (!isBgmMuted) {
    bgmTitle.pause();
    bgmGame.currentTime = 0;
    bgmGame.play();
  }
  seStart.play();  // スタートSE
  loop();
});

// -------------------- 入力 --------------------
// BGM ON/OFF切り替えボタン処理
let isBgmMuted = true;  // 初期はBGM OFF（ユーザー操作待ち）

const bgmToggleBtn = document.getElementById("bgmToggleBtn");
bgmToggleBtn.style.display = "block";
bgmToggleBtn.style.position = "absolute";
bgmToggleBtn.style.zIndex = "10";

bgmToggleBtn.addEventListener("click", () => {
  isBgmMuted = !isBgmMuted;

  if (isBgmMuted) {
    bgmTitle.pause();
    bgmGame.pause();
    bgmInvincible.pause();
    bgmToggleBtn.textContent = "BGM OFF";
    bgmToggleBtn.style.backgroundColor = "#cccccc";
  } else {
    if (isTitleScreen) {
      bgmTitle.currentTime = 0;
      bgmTitle.play();
    } else if (isInvincible) {
      bgmInvincible.currentTime = 0;
      bgmInvincible.play();
    } else {
      bgmGame.currentTime = 0;
      bgmGame.play();
    }
    bgmToggleBtn.textContent = "BGM ON";
    bgmToggleBtn.style.backgroundColor = "#eeeeee";
  }
});


// ヘルパー関数
function playBgm(bgm) {
  if (!isBgmMuted) {
    bgm.currentTime = 0;
    bgm.play();
  }
}
// BGM・SEのAudioオブジェクト定義
const bgmTitle      = new Audio("sound/bgm_title.mp3");
const bgmGame       = new Audio("sound/bgm_game.mp3");
const bgmInvincible = new Audio("sound/bgm_invincible.mp3");
const bgmBoss     = new Audio("sound/bgm_boss.mp3");

bgmTitle.loop = true;
bgmGame.loop  = true;
bgmInvincible.loop = true;
bgmBoss.loop = true;

const seShotNormal  = new Audio("sound/se_shot.mp3");
const seShotPower   = new Audio("sound/se_power_shot.mp3");
const seEnemyHit    = new Audio("sound/se_enemy_hit.mp3");
const sePlayerHit   = new Audio("sound/se_player_hit.mp3");
const seBeerGet     = new Audio("sound/se_beer.mp3");
const seLadyGet     = new Audio("sound/se_lady.mp3");
const seEnemyMissed = new Audio("sound/se_enemy_miss.mp3");
const seGameOver    = new Audio("sound/se_gameover.mp3");
const seStart       = new Audio("sound/se_start.mp3");
const seRetry       = new Audio("sound/se_retry.mp3");
const seTitle       = new Audio("sound/se_title.mp3");
const seBossDown  = new Audio("sound/se_boss_down.mp3");
const se_boss_hit  = new Audio("sound/se_boss_Hit.mp3");

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === " ") {
    bullets.push({
      x: player.x + player.width,
      y: player.y + player.height / 2 - (isPoweredUp ? 15 : 5),
      width: isPoweredUp ? 30 : 10,
      height: isPoweredUp ? 30 : 10,
      speed: 7,
      powered: isPoweredUp
    });
  
    const shotSound = isPoweredUp ? seShotPower : seShotNormal;
    shotSound.cloneNode().play();
  }

});
document.addEventListener("keyup", e => keys[e.key] = false);

// -------------------- 更新 --------------------
function update() {
  /* プレイヤー移動 */
  if (keys["ArrowUp"])   player.y -= player.speed;
  if (keys["ArrowDown"]) player.y += player.speed;
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  /* 弾移動 */
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].speed;
    if (bullets[i].x > canvas.width) bullets.splice(i, 1);
  }

  /* 敵生成 */
  if (Math.random() < 0.02) {
    const t = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemies.push({
      type:   t.name,
      x:      canvas.width,
      y:      Math.random() * (canvas.height - 80),
      width:  80,
      height: 80,
      speed:  t.speed,
      score:  t.score
    });
  }

  /* ビール生成 */
  if (Math.random() < 0.003) {
    beers.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 60),
      width: 60,
      height:60,
      speed: 5,
      score: 5
    });
  }
  
  /* 女性生成 : 画面に1体だけ */
  if (ladies.length === 0 && Math.random() < 0.0003) {
    ladies.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 120),
      width: 120,
      height:120,
      speed: 5,
      score: 10
    });
  }

  // ボス出現（ランダム）
  if (!isBossActive && Math.random() < 0.0002) {
    boss = {
      x: canvas.width,
      y: canvas.height / 2 - 100,
      width: 200,
      height: 200,
      speed: 2
    };
    bossHp = 30;
    isBossActive = true;

    if (!isBgmMuted) {
      if (!bgmBoss.paused) bgmBoss.pause();
      bgmGame.pause();
      bgmBoss.currentTime = 0;
      bgmBoss.play();
    }
  }
  /* 敵移動 & 逃した判定 */
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed;
    if (e.x + e.width < 0) {
      missedSnacks++;
      enemies.splice(i,1);
      seEnemyMissed.play();
      seEnemyMissed.cloneNode().play();
    }
  }
  if (missedSnacks >= 3) gameOver();

  /* ビール移動 & 取得 */
  for (let i = beers.length - 1; i >= 0; i--) {
    const b = beers[i];
    b.x -= b.speed;

    if (collisionRect(player, b)) {
      isPoweredUp = true;
      beerStreak = Math.min(beerStreak + 1, 5);
      const beerScore = 5 * Math.pow(2, beerStreak - 1);
      score += beerScore;

      // ✅ ← ここでのみ表示テキストを追加する
      floatingTexts.push({
        x: b.x,
        y: b.y,
        text: `x${Math.pow(2, beerStreak - 1)} BONUS!`,
        life: 60
      });

      const beerSound = seBeerGet.cloneNode();
      beerSound.volume = 1.0;
      beerSound.play();

      beers.splice(i, 1);  // ← ここで削除
    }
    else if (b.x + b.width < 0) {
      beers.splice(i, 1);
      beerStreak = 0;
    }
  }
    
  /* 女性移動 & 取得 */
  for (let i = ladies.length - 1; i >= 0; i--) {
    const l = ladies[i];
    l.x -= l.speed;
    if (collisionRect(player,l)) {
      isInvincible    = true;
      invincibleTimer = 600;
      ladies.splice(i,1);

      // 正しい場所に移動！
      if (!isBgmMuted) {
        bgmGame.pause();
        bgmInvincible.currentTime = 0;
        bgmInvincible.play();
      }
      seLadyGet.play();
    }
    if (invincibleTimer === 0 && isInvincible) {
      isInvincible = false;
      
    }
  }
  // ボス移動
  if (isBossActive && boss) {
    boss.x -= boss.speed;
    if (boss.x + boss.width < 0) {
      isBossActive = false;
      boss = null;
      if (!isBgmMuted) {
        bgmBoss.pause();
        bgmGame.currentTime = 0;
        bgmGame.play();
      }
    }
  }

  /* 無敵タイマー */
  if (invincibleTimer > 0) {
    invincibleTimer--;
    if (invincibleTimer === 0) {
      isInvincible = false;
      if (!isBgmMuted) {
        bgmInvincible.pause();
        bgmGame.currentTime = 0;
        bgmGame.play();
      }
    }   
  }

  // 弾 × 敵（1発で1体だけ倒す）
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hasHit = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (collisionRect(b, e)) {
        score += e.score;
        seEnemyHit.cloneNode().play();
        enemies.splice(j, 1);    // 敵を消す
        bullets.splice(i, 1);    // 弾も消す
        hasHit = true;
        break;                  // 敵ループを抜ける
      }
    }

    if (hasHit) continue; // 弾が当たったら次の弾へ（2体目を防ぐ）
  }


  /* プレイヤー×敵 */
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (collisionRect(player, e)) {

      if (isInvincible) {
        // 無敵中 → スコア加算＆敵消滅、パワー解除しない
        score += e.score;
        enemies.splice(i, 1);
        continue;
      }

      if (isPoweredUp) {
        // 通常時＆パワーアップ → 敵消滅＆パワー解除
        isPoweredUp = false;
        enemies.splice(i, 1);
      } else {
        // 通常状態 → ダメージ
        sePlayerHit.play();
        gameOver();
      }

      break;
    }
  }

  /* プレイヤー × ボス */
  if (isBossActive && boss && collisionRect(player, boss)) {
    if (!isInvincible) {
      sePlayerHit.play();
      gameOver();
    }
  }
  
  // 弾 × ボス
  if (isBossActive && boss) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (collisionRect(b, boss)) {
        bossHp--;
        bullets.splice(i, 1); // ここで弾を消す
        playSeBossHit();

        if (bossHp <= 0) {
          isBossActive = false;
          boss = null;
          score += 100;
          seBossDown.play();
          if (!isBgmMuted) {
            bgmBoss.pause();
            bgmGame.currentTime = 0;
            bgmGame.play();
          }
        }
        break; // 弾は1発で1ヒットまで
      }
    }
  }

}
function playSeBossHit() {
  const se = new Audio("sound/se_boss_hit.mp3");
  se.volume = 1.0;
  se.play();
}

// -------------------- 衝突判定 --------------------
function collisionRect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

// -------------------- 描画 --------------------
function draw() {
  if (isTitleScreen) {
    // 背景
    if (bgImg.complete && bgImg.naturalWidth) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ロゴ（上に寄せる）
    if (titleLogoImg.complete && titleLogoImg.naturalWidth) {
      const logoW = 400;
      const logoH = 120;
      const logoX = canvas.width / 2 - logoW / 2;
      const logoY = canvas.height * 0.1; // 上部に表示
      ctx.drawImage(titleLogoImg, logoX, logoY, logoW, logoH);
    }

    // キャラ（中央＋拡大）
    if (titleCharImg.complete && titleCharImg.naturalWidth) {
      const charW = 300;
      const charH = 300;
      const charX = canvas.width / 2 - charW / 2;
      const charY = canvas.height / 2 - charH / 2 + 50;
      ctx.drawImage(titleCharImg, charX, charY, charW, charH);
    }

    // STARTボタンの位置をHTMLから操作（キャラ足元に）
    const startBtn = document.getElementById("startBtn");
    startBtn.style.position = "absolute";
    startBtn.style.left = `${canvas.offsetLeft + canvas.width / 2 - 0}px`;
    startBtn.style.top = `${canvas.offsetTop + canvas.height * 0.7}px`;
    startBtn.style.transform = "translateX(-50%)";
    startBtn.style.zIndex = "10";
    
    // 説明文（さらに下）
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("股間のSTARTを押してゲーム開始！", canvas.width / 2, canvas.height * 0.88);
    
    ctx.font = "18px Arial";
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, canvas.height * 0.95);
    return;
  }

  if (bgImg.complete && bgImg.naturalWidth) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!isInvincible || Math.floor(invincibleTimer / 5) % 2 === 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }

  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = b.powered ? "skyblue" : "yellow";
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.powered ? "lightblue" : "white";
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  enemies.forEach(e => {
    const img = enemyImages[e.type];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, e.x, e.y, e.width, e.height);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(e.x, e.y, e.width, e.height);
    }
  });

  beers.forEach(b => ctx.drawImage(beerImg, b.x, b.y, b.width, b.height));
  ladies.forEach(l => ctx.drawImage(ladyImg, l.x, l.y, l.width, l.height));

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`SCORE: ${score}`, 70, 30);
  ctx.font = "16px Arial";
  ctx.fillText(`MISS: ${missedSnacks}/3`, 70, 55);
  ctx.fillText(`HIGH SCORE: ${highScore}`, 700, 30);

  if (isGameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 1.5 - 140, canvas.height / 2);

    const buttonWidth  = "120px";
    const buttonHeight = "40px";
    // リトライボタンの位置を調整
    retryBtn.style.position = "absolute";
    retryBtn.style.left     = `${canvas.offsetLeft + canvas.width / 2 - 140}px`;
    retryBtn.style.top      = `${canvas.offsetTop + canvas.height / 2.15 + 80}px`;
    retryBtn.style.width    = buttonWidth;
    retryBtn.style.height   = buttonHeight;
    retryBtn.style.fontSize = "18px";
    // タイトルボタンの位置を調整
    titleBtn.style.position = "absolute";
    titleBtn.style.left     = `${canvas.offsetLeft + canvas.width / 1.45 - 140}px`;
    titleBtn.style.top      = `${canvas.offsetTop + canvas.height / 2.15 + 80}px`;
    titleBtn.style.width    = buttonWidth;
    titleBtn.style.height   = buttonHeight;
    titleBtn.style.fontSize = "18px";
  }
  // ボス描画
  if (isBossActive && boss && bossImg.complete && bossImg.naturalWidth) {
    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
  }
  // 浮かび上がるテキストの描画
  floatingTexts.forEach((t, index) => {
    ctx.fillStyle = "orange";
    ctx.font = "bold 20px Arial";
    ctx.fillText(t.text, t.x, t.y);
    t.y -= 1;        // 浮かび上がる
    t.life--;
    if (t.life <= 0) floatingTexts.splice(index, 1);
  });
}

// -------------------- ループ --------------------
function loop() {
  if (!isTitleScreen && !isGameOver) update();
  draw();
  requestAnimationFrame(loop);
}

// -------------------- GAME OVER & リトライ --------------------
function gameOver() {
  isGameOver = true;
   isBossActive = false;
   boss = null;
   bgmBoss.pause();
   bgmBoss.currentTime = 0;

  if (!isBgmMuted) {
    bgmGame.pause();
  }
  seGameOver.play();
  retryBtn.style.display = "block";
  titleBtn.style.display = "block";
  if (score > highScore) {
    highScore = score;
  }
  retryBtn.style.display = "block";
}
retryBtn.addEventListener("click", () => {
  isBossActive = false;
  boss = null;
  bgmBoss.pause();
  bgmBoss.currentTime = 0;
  seRetry.play();
  bullets.length = 0;
  enemies.length = 0;
  beers.length = 0;
  ladies.length = 0;
  score = 0;
  missedSnacks = 0;
  isPoweredUp = false;
  isInvincible = false;
  player.y = 250;
  isGameOver = false;
  retryBtn.style.display = "none";
  titleBtn.style.display = "none";
  loop();
});
titleBtn.addEventListener("click", () => {
  isBossActive = false;
  boss = null;
  bgmBoss.pause();
  bgmBoss.currentTime = 0;
  seTitle.play();
  bullets.length = 0;
  enemies.length = 0;
  beers.length = 0;
  ladies.length = 0;
  score = 0;
  missedSnacks = 0;
  isPoweredUp = false;
  isInvincible = false;
  player.y = 250;
  isGameOver = false;

  isTitleScreen = true;
  retryBtn.style.display = "none";
  titleBtn.style.display = "none";
  startBtn.style.display = "block";

  bgmGame.pause();         // ゲームBGM停止
  bgmTitle.currentTime = 0;
  bgmTitle.play();         // タイトルBGM再生

  draw(); 
});
