// -------------------- 初期設定 --------------------
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// -------------------- 画像 --------------------
const playerImg = new Image(); playerImg.src = "img/player.png";
const bulletImg = new Image(); bulletImg.src = "img/bullet.png";
const bgImg     = new Image(); bgImg.src    = "img/background.jpg";
const beerImg   = new Image(); beerImg.src  = "img/beer.png";
const ladyImg   = new Image(); ladyImg.src  = "img/lady.png";

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

const bullets = [];
const enemies = [];
const beers   = [];
const ladies  = [];

let score           = 0;
let missedSnacks    = 0;
let isPoweredUp     = false;   // ビールで弾が巨大
let isInvincible    = false;   // 女性で無敵
let invincibleTimer = 0;       // 10秒 = 600F (60fps前提)
let isGameOver      = false;

const keys = {};

// おつまみタイプ
const enemyTypes = [
  { name: "edamame",     speed: 3, score: 1 },
  { name: "sashimi",     speed: 4, score: 2 },
  { name: "yakitori",    speed: 5, score: 3 },
  { name: "grilledfish", speed: 6, score: 4 },
  { name: "ramen",       speed: 7, score: 5 }
];

// -------------------- リトライ --------------------
const retryBtn = document.getElementById("retryBtn");
retryBtn.style.display = "none";

// -------------------- 入力 --------------------
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " ") {
    bullets.push({
      x: player.x + player.width,
      y: player.y + player.height / 2 - (isPoweredUp ? 15 : 5),
      width:  isPoweredUp ? 30 : 10,
      height: isPoweredUp ? 30 : 10,
      speed: 7,
      powered: isPoweredUp
    });
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
  if (Math.random() < 0.005) {
    beers.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 60),
      width: 60,
      height:60,
      speed: 5
    });
  }

  /* 女性生成 : 画面に1体だけ */
  if (ladies.length === 0 && Math.random() < 0.0003) {
    ladies.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 120),
      width: 120,
      height:120,
      speed: 5
    });
  }

  /* 敵移動 & 逃した判定 */
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed;
    if (e.x + e.width < 0) {
      missedSnacks++;
      enemies.splice(i,1);
    }
  }
  if (missedSnacks >= 3) gameOver();

  /* ビール移動 & 取得 */
  for (let i = beers.length - 1; i >= 0; i--) {
    const b = beers[i];
    b.x -= b.speed;
    if (collisionRect(player,b)) {
      isPoweredUp = true;
      beers.splice(i,1);
    } else if (b.x + b.width < 0) {
      beers.splice(i,1);
    }
  }

  /* 女性移動 & 取得 */
  for (let i = ladies.length - 1; i >= 0; i--) {
    const l = ladies[i];
    l.x -= l.speed;
    if (collisionRect(player,l)) {
      isInvincible    = true;
      invincibleTimer = 600;     // 10秒
      ladies.splice(i,1);
    } else if (l.x + l.width < 0) {
      ladies.splice(i,1);
    }
  }

  /* 無敵タイマー */
  if (invincibleTimer > 0) {
    invincibleTimer--;
    if (invincibleTimer === 0) isInvincible = false;
  }

  /* 弾×敵 */
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (collisionRect(b,e)) {
        score += e.score;
        bullets.splice(i,1);
        enemies.splice(j,1);
        break;
      }
    }
  }

  /* プレイヤー×敵 */
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (collisionRect(player,e)) {
      if (isPoweredUp) {
        isPoweredUp = false;
        enemies.splice(i,1);
      } else if (isInvincible) {
        enemies.splice(i,1);
      } else {
        gameOver();
      }
      break;
    }
  }
}

// -------------------- 衝突判定ヘルパ --------------------
function collisionRect(a,b){
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

// -------------------- 描画 --------------------
function draw() {
  /* 背景 */
  if (bgImg.complete && bgImg.naturalWidth) {
    ctx.drawImage(bgImg,0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  } else {
    ctx.fillStyle="#222"; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  /* プレイヤー (赤黄点滅) */
  if (!isInvincible || Math.floor(invincibleTimer/5)%2===0){
    ctx.drawImage(playerImg,player.x,player.y,player.width,player.height);
  }else{
    ctx.fillStyle = Math.floor(invincibleTimer/5)%2 ? "red":"yellow";
    ctx.fillRect(player.x,player.y,player.width,player.height);
  }

  /* 弾 */
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x+b.width/2,b.y+b.height/2,b.width/2,0,Math.PI*2);
    ctx.fillStyle = b.powered ? "skyblue":"yellow";
    ctx.shadowBlur=10;
    ctx.shadowColor=b.powered?"lightblue":"white";
    ctx.fill(); ctx.shadowBlur=0;
  });

  /* 敵 */
  enemies.forEach(e=>{
    const img = enemyImages[e.type];
    if (img.complete&&img.naturalWidth){
      ctx.drawImage(img,e.x,e.y,e.width,e.height);
    }else{
      ctx.fillStyle="green"; ctx.fillRect(e.x,e.y,e.width,e.height);
    }
  });

  /* ビール */
  beers.forEach(b=>ctx.drawImage(beerImg,b.x,b.y,b.width,b.height));

  /* 女性 */
  ladies.forEach(l=>ctx.drawImage(ladyImg,l.x,l.y,l.width,l.height));

  /* スコア / MISS */
  ctx.fillStyle="white";
  ctx.font="20px Arial";
  ctx.fillText(`SCORE: ${score}`,20,30);
  ctx.font="16px Arial";
  ctx.fillText(`MISS: ${missedSnacks}/3`,20,55);

  /* GAME OVER */
  if(isGameOver){
    ctx.fillStyle="red";
    ctx.font="48px Arial";
    ctx.fillText("GAME OVER",canvas.width/2-140,canvas.height/2);
  }
}

// -------------------- ループ --------------------
function loop(){
  if(!isGameOver) update();
  draw();
  requestAnimationFrame(loop);
}
playerImg.onload = ()=>loop();

// -------------------- GAME OVER & リトライ --------------------
function gameOver(){
  isGameOver = true;
  retryBtn.style.display="block";
}
retryBtn.addEventListener("click",()=>{
  bullets.length=0; enemies.length=0; beers.length=0; ladies.length=0;
  score=0; missedSnacks=0; isPoweredUp=false; isInvincible=false;
  player.y=250; isGameOver=false; retryBtn.style.display="none";
});
