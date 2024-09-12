const root: HTMLElement = document.createElement("main");
document.body.appendChild(root);
const canvas = document.createElement("canvas");
canvas.width =
  window.innerWidth > 1200
    ? window.innerWidth
    : window.innerWidth > 1000
    ? window.innerWidth * 1.2
    : window.innerWidth > 800
    ? window.innerWidth * 1.5
    : window.innerWidth * 2;
canvas.height =
  window.innerWidth > 1200
    ? window.innerHeight
    : window.innerWidth > 1000
    ? window.innerHeight * 1.2
    : window.innerWidth > 800
    ? window.innerHeight * 1.5
    : window.innerHeight * 2;

root.appendChild(canvas);
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

const pointsDisplay = document.createElement("div");
pointsDisplay.className = "points";
root.appendChild(pointsDisplay);

const teamColors: string[] = ["deepskyblue", "crimson"];
const teamNames: string[] = ["Blue", "Red"];

const collabElement1 = document.createElement("div");
collabElement1.classList.add("team_score");
collabElement1.classList.add("_T1");
collabElement1.style.color = teamColors[0];
collabElement1.innerHTML = teamNames[0] + "<br/>points: 0";
const collabElement2 = document.createElement("div");
collabElement2.classList.add("team_score");
collabElement2.classList.add("_T2");
collabElement2.style.color = teamColors[1];
collabElement2.innerHTML = teamNames[1] + "<br/>points: 0";

const collabScoreboard = document.createElement("div");
collabScoreboard.classList.add("collab_container");
collabScoreboard.appendChild(collabElement1);
collabScoreboard.appendChild(collabElement2);

const soloScoreboard = document.createElement("div");
soloScoreboard.classList.add("solo_container");
soloScoreboard.classList.add("visible");

pointsDisplay.appendChild(collabScoreboard);
pointsDisplay.appendChild(soloScoreboard);

const gameOverPrompt = document.createElement("div");
gameOverPrompt.classList.add("endPrompt");

const endTitle = document.createElement("div");
endTitle.className = "endTitle";
gameOverPrompt.appendChild(endTitle);
const scoreDisplay = document.createElement("div");
scoreDisplay.className = "scoreDisplay";
scoreDisplay.innerText = "score: 0";
gameOverPrompt.appendChild(scoreDisplay);
const replayButton = document.createElement("button");
replayButton.className = "replayButton";
replayButton.innerText = "Play Again";
gameOverPrompt.appendChild(replayButton);

root.appendChild(gameOverPrompt);

const playerNames: string[] = [];
const botNames: string[] = [];

var coinHistory: number[][] = [];
const coinShadowColors = ["rgba(80,80,80,0.5)", "rgba(50,50,50,0.5)"];
const canvasMargin = 75;
const decayFactor = 0.04;
const defaultR = 20;
const coinR = 15;
const coinDistance = 75;
const tongueRadius = 50;
const defaultMinSize = 10;
const growFactor = 10;
const DEBUG = false;
const MIN_TAIL_LENGTH = 20;
const MAX_TAIL_LENGTH = 300;
const TAIL_DENSITY = 3;
const NAMETAG_HEIGHT = -30;
const NAMETAG_OFFSET = 30;
const MAX_TAG_CONTENT_LENGTH = 32;
const COIN_ANIMATION_PARTICLE_COUNT = 10;
const PARTICLE_DECAY_FACTOR = 0.12;
const PARTICLE_FRICTION_FACTOR = 0.99;
const COIN_FILL_COLOR = "rgb(249,219,61)";
const MIN_PARTICLE_SIZE = 3;
const particlesEnabled = true;
const REFERENCE_MASS = 5;
const MAX_SPEED_HARD_CAP = 12;
const COLLISION_MIN = 1;
const updateInterval = 15;

let gameEnded = true; // waits for the game selector menu before running

function coinRandomizer() {
  return [
    Math.floor(
      Math.random() * (canvas.width - 2 * canvasMargin) + canvasMargin
    ),
    Math.floor(
      Math.random() * (canvas.height - 2 * canvasMargin) + canvasMargin
    ),
  ];
}

const pressedKeys = new Set();

window.addEventListener("keydown", (e) => {
  pressedKeys.add(e.key);
});

window.addEventListener("keyup", (e) => {
  pressedKeys.delete(e.key);
});

const DifficultySettings = {
  botAcc: 0.12,
  plrAcc: 0.15,
  botMaxSpd: 5,
  get botSpeedLimit() {
    return this.botMaxSpd;
  },
  set botSpeedLimit(value) {
    this.botMaxSpd = value;
  },
  plrMaxSpd: 6,
  get plrSpeedLimit() {
    return this.plrMaxSpd;
  },
  set plrSpeedLimit(value) {
    this.plrMaxSpd = value;
  },
  W_a_M_CoinCount: 5,
  Collab_CoinCount: 2,
  Normal_CoinCount: 1,
  T_A_CoinCount: 1,
  W_a_M_UpdateCD: <number>2000,
  T_A_GameTimerDuration: <number>60000,

  get botAcceleration(): number {
    return this.botAcc;
  },
  set botAcceleration(value: number) {
    this.botAcc = value;
  },
  get playerAcceleration(): number {
    return this.plrAcc;
  },
  set playerAcceleration(value: number) {
    this.plrAcc = value;
  },
  get CoinUpdate(): number {
    return this.W_a_M_UpdateCD;
  },
  set CoinUpdate(value: number) {
    this.W_a_M_UpdateCD = value;
  },
  get TimeLimit(): number {
    return this.T_A_GameTimerDuration;
  },
  set TimeLimit(value: number) {
    this.T_A_GameTimerDuration = value;
  },
};

type coinData = {
  x: number;
  y: number;
  r: number;
};

class Coin {
  data: coinData;
  constructor() {
    const posArgs = coinRandomizer();
    this.data = { x: posArgs[0], y: posArgs[1], r: coinR };
  }
}

class Actor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  points: number;
  displayElement: HTMLDivElement;
  tailLength: number;
  id: string;
  r: number;
  dir: number;
  angularSpeed: number;
  angularAcc: number;
  linearAcc: number;
  minSize: number;
  tongueOut: boolean;
  color: string;
  borderColor: string;
  hAxis: number;
  vAxis: number;
  inputBindings?: string[];
  history: [number, number, number][];
  team: number;
  target?: Coin;
  color_alpha: string;
  borderColor_alpha: string;
  tagColor: string;
  mass: number;
  maxSpeed: number;
  constructor(id: string, team: number, color: string, borderColor: string) {
    this.x = Math.floor(
      Math.random() * (canvas.width - 2 * canvasMargin) + canvasMargin
    );
    this.y = Math.floor(
      Math.random() * (canvas.height - 2 * canvasMargin) + canvasMargin
    );
    this.vx = Math.floor(Math.random() * 10) - 5;
    this.vy = Math.floor(Math.random() * 10) - 5;
    this.id = id;
    this.points = 0;
    this.r = defaultR;
    this.dir = 0;
    this.angularAcc = 0.02;
    this.angularSpeed = 0;
    this.minSize = defaultMinSize;
    this.tailLength = MIN_TAIL_LENGTH;
    this.tongueOut = false;
    this.hAxis = 1;
    this.vAxis = 0;
    this.mass = REFERENCE_MASS;
    this.maxSpeed = 5;
    this.linearAcc = 0.1;
    this.history = [];
    this.team = team;
    this.tagColor = this.team === 1 ? teamColors[0] : teamColors[1];
    this.color = color;
    this.borderColor = borderColor;
    this.color_alpha = color + "80";
    this.borderColor_alpha = borderColor + "80";
    this.displayElement = document.createElement("div");
    this.displayElement.classList.add("score_text");
    this.displayElement.style.color = this.color;
    this.displayElement.style.backgroundColor = "rgba(0,0,0,0.75)";
    let temp = bannerName(this.id).join(" ");
    this.displayElement.innerText =
      temp.length < MAX_TAG_CONTENT_LENGTH
        ? temp + ": 0"
        : temp.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + "..: 0";
    soloScoreboard.appendChild(this.displayElement);
  }

  distanceTo(c: Coin): number {
    return (
      (c.data.x - this.x) * (c.data.x - this.x) +
      (c.data.y - this.y) * (c.data.y - this.y)
    );
  }

  targetUpdate() {
    this.target = coinList.toSorted((a: Coin, b: Coin) => {
      return this.distanceTo(a) - this.distanceTo(b);
    })[0];
  }
}

class Player extends Actor {
  static memberCount = 0;
  inputBindings: string[];
  targetX: number;
  targetY: number;
  constructor(
    inputBindings: string[],
    team: number,
    color: string,
    borderColor: string,
    mass: number
  ) {
    super("plr_" + (++Player.memberCount).toString(), team, color, borderColor);
    this.mass = mass;
    this.inputBindings = inputBindings;
    this.linearAcc =
      DifficultySettings.playerAcceleration * ((REFERENCE_MASS * 2) / mass);
    this.maxSpeed = Math.min(
      DifficultySettings.plrSpeedLimit * ((REFERENCE_MASS * 3) / mass),
      MAX_SPEED_HARD_CAP
    );
    this.hAxis = 1;
    this.vAxis = 0;
    this.targetX = this.x + this.hAxis * coinDistance;
    this.targetY = this.y + this.vAxis * coinDistance;
    this.targetUpdate();
  }
}

class Bot extends Actor {
  static memberCount = 0;
  constructor(team: number, color: string, borderColor: string, mass: number) {
    super("bot_" + (++Bot.memberCount).toString(), team, color, borderColor);
    this.mass = mass;
    this.linearAcc =
      DifficultySettings.botAcceleration * ((REFERENCE_MASS * 2) / mass);
    this.maxSpeed = Math.min(
      DifficultySettings.botSpeedLimit * ((REFERENCE_MASS * 3) / mass),
      MAX_SPEED_HARD_CAP
    );
    this.targetUpdate();
  }
}

const playerList: Player[] = [];
const botList: Bot[] = [];

const Team_A: Actor[] = [];
const Team_B: Actor[] = [];

function bannerName(id: string): string[] {
  if (id.startsWith("t_")) {
    return ["(Team)", teamNames[parseInt(id.slice(2)) - 1]];
  } else if (id.startsWith("bot_")) {
    return ["(Bot)", botNames[parseInt(id.slice(4)) - 1]] || ["(Bot)", ""];
  } else if (id.startsWith("plr_")) {
    return (
      ["(Player)", playerNames[parseInt(id.slice(4)) - 1]] || ["(Player)", ""]
    );
  } else {
    return ["<unknown>", ""];
  }
}

const coinList: Coin[] = [];

function addCoins() {
  while (coinList.length < gameModeVariables.coinCount) {
    coinList.push(new Coin());
  }
}

class CoinParticle {
  static posVariation: number = 10;
  static minDistance: number = 5;
  static rVariation: number = 4;
  static minR: number = 5;
  static speedVariation: number = 1.2;
  static minSpeed: number = 0.48;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  constructor(centerX: number, centerY: number, x: number, y: number) {
    const relAngle = Math.atan2(y - centerY, x - centerX);
    this.r = CoinParticle.minR + Math.random() * CoinParticle.rVariation;
    this.x = x;
    this.y = y;
    const speed =
      CoinParticle.minSpeed + Math.random() * CoinParticle.speedVariation;
    this.vx = speed * Math.cos(relAngle);
    this.vy = speed * Math.sin(relAngle);
  }
  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.r -= PARTICLE_DECAY_FACTOR;
    this.vx *= PARTICLE_FRICTION_FACTOR;
    this.vy *= PARTICLE_FRICTION_FACTOR;
    return this.r <= MIN_PARTICLE_SIZE;
  }
}

let coinParticleList: CoinParticle[] = [];

function coinPickAnimation(x: number, y: number) {
  for (let i = 0; i < COIN_ANIMATION_PARTICLE_COUNT; i++) {
    const xm = Math.random() - 0.5 > 0 ? 1 : -1;
    const ym = Math.random() - 0.5 > 0 ? 1 : -1;
    const px =
      x +
      xm *
        (Math.random() * CoinParticle.posVariation + CoinParticle.minDistance);
    const py =
      y +
      ym *
        (Math.random() * CoinParticle.posVariation + CoinParticle.minDistance);
    coinParticleList.push(new CoinParticle(x, y, px, py));
  }
}

function drawParticle(obj: CoinParticle) {
  ctx.fillStyle = "rgba(249,219,61, 0.5)";
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

function updateCoinParticles() {
  let indexOffset = 0;
  let removeParticleIndices: number[] = [];
  for (let i = 0; i < coinParticleList.length; i++) {
    if (coinParticleList[i].update()) {
      removeParticleIndices.push(i);
    }
  }
  for (let i = 0; i < removeParticleIndices.length; i++) {
    coinParticleList.splice(removeParticleIndices[i] - indexOffset++, 1);
  }
  for (let i = 0; i < coinParticleList.length; i++) {
    drawParticle(coinParticleList[i]);
  }
}

function updateCoin(obj: Coin, animated = false) {
  const myData = coinRandomizer();
  if (DEBUG) coinHistory.push([obj.data.x, obj.data.y]);
  if (animated) coinPickAnimation(obj.data.x, obj.data.y);

  obj.data.x = myData[0];
  obj.data.y = myData[1];
}

function endGame(
  actorIDList: string[],
  displayScore: number,
  winCon = true,
  draw = false
) {
  gameModeController.resetSettings();
  while (coinList.length > 0) {
    coinList.pop();
  }
  endTitle.innerHTML = draw
    ? "It's a draw!<hr/>Winners:<br/>" +
      actorIDList
        .map((id) => {
          let temp = bannerName(id).join(" ");
          return temp.length < MAX_TAG_CONTENT_LENGTH
            ? temp
            : temp.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + "..";
        })
        .join("<br/>")
    : winCon
    ? bannerName(actorIDList[0]).join(" ") + " Wins"
    : "Game Over";
  var newClass = draw ? "tie" : winCon ? "win" : "lose";
  endTitle.className = "endTitle";
  if (actorIDList[0] === "t_1" || actorIDList[0] === "t_2") {
    endTitle.style.color =
      actorIDList[0] === "t_1" ? teamColors[0] : teamColors[1];
  } else {
    endTitle.classList.add(newClass);
  }
  scoreDisplay.innerText = "score: " + displayScore;
  gameOverPrompt.classList.add("visible");
  gameEnded = true;
  gameLoop();
}

type gameMode = "NORMAL" | "WHACK_A_MOLE" | "TIME_ATTACK" | "COLLAB";

const gameModeVariables = {
  coinUpdateIntervalKeys: <number[]>[],
  gameTimerKey: 0,
  coinCount: 1,
  normalWinPoints: 30,
  collabWinPoints: 60,
  winPoints: 60,
  selectedMode: <gameMode>"COLLAB",
  up_updateTimeoutKeys: <number[]>[],
  get UpUpdate(): number[] {
    return this.up_updateTimeoutKeys;
  },
  set UpUpdate(value: number[]) {
    this.up_updateTimeoutKeys = value;
  },
  addUpUpKey: (key: number) => {
    gameModeVariables.up_updateTimeoutKeys.push(key);
  },
  removeUpUpKey: () => {
    gameModeVariables.up_updateTimeoutKeys.shift();
  },
};

const gameModeController = {
  //maze and pvp to be added later

  //WHACK_A_MOLE
  restartPointerInterval: () => {
    gameModeVariables.coinUpdateIntervalKeys.forEach((key) => {
      clearInterval(key);
    });
    gameModeVariables.coinUpdateIntervalKeys = [];
    while (coinList.length > 0) {
      coinList.pop();
    }
    addCoins();
    coinList.forEach((coin, i) => {
      gameModeVariables.addUpUpKey(
        setTimeout(() => {
          gameModeVariables.coinUpdateIntervalKeys.push(
            setInterval(() => {
              updateCoin(coin, false);
            }, DifficultySettings.CoinUpdate)
          );
          gameModeVariables.removeUpUpKey();
        }, (i / coinList.length) * DifficultySettings.CoinUpdate)
      );
    });
  },

  //TIME_ATTACK
  setGameTimer: () => {
    gameModeVariables.gameTimerKey = setTimeout(() => {
      const scoreArr = botList.concat(playerList).toSorted((a, b) => {
        return b.points - a.points;
      });
      const bestScore = scoreArr[0].points;
      const winners = scoreArr.filter((a) => a.points === bestScore);
      if (winners.length === 1) {
        endGame([winners[0].id], bestScore, true);
      } else if (winners.length > 1) {
        endGame(
          winners.map((winner) => winner.id),
          bestScore,
          true,
          true
        );
      } else {
        endGame([], bestScore, false);
      }
    }, DifficultySettings.TimeLimit);
  },

  //COLLAB
  enableCollabDisplay: () => {
    soloScoreboard.classList.remove("visible");
    collabScoreboard.classList.add("visible");
  },
  disableCollabDisplay: () => {
    collabScoreboard.classList.remove("visible");
    soloScoreboard.classList.add("visible");
  },

  //NORMAL
  resetSettings: () => {
    gameModeVariables.winPoints = gameModeVariables.normalWinPoints;
    gameModeVariables.coinUpdateIntervalKeys.forEach((key) => {
      clearInterval(key);
    });
    gameModeVariables.UpUpdate.forEach((key) => {
      clearTimeout(key);
    });
    gameModeVariables.UpUpdate = [];
    clearTimeout(gameModeVariables.gameTimerKey);
    while (coinList.length > 0) {
      coinList.pop();
    }
  },

  setGameMode: (mode: gameMode) => {
    gameModeController.resetSettings();
    gameModeVariables.selectedMode = mode;
    switch (mode) {
      case "NORMAL":
        gameModeVariables.coinCount = DifficultySettings.Normal_CoinCount;
        addCoins();
        gameModeController.disableCollabDisplay();
        break;
      case "WHACK_A_MOLE":
        gameModeVariables.coinCount = DifficultySettings.W_a_M_CoinCount;
        addCoins();
        gameModeController.disableCollabDisplay();
        gameModeController.restartPointerInterval();
        break;
      case "TIME_ATTACK":
        gameModeVariables.coinCount = DifficultySettings.T_A_CoinCount;
        addCoins();
        gameModeController.disableCollabDisplay();
        gameModeController.setGameTimer();
        break;
      case "COLLAB":
        gameModeVariables.coinCount = DifficultySettings.Collab_CoinCount;
        gameModeVariables.winPoints = gameModeVariables.collabWinPoints;
        addCoins();
        gameModeController.enableCollabDisplay();
        break;
    }
  },

  //NORMAL, (done)
  //WHACK_A_MOLE, (done)
  //TIME_ATTACK, (done)
  //COLLAB, (done)

  //MAZE,
  //PVP (Versus)
};

function addScore(actor: Actor) {
  actor.points++;
  updateCoin(actor.target!, true);
  actor.targetUpdate();
  let score_a = Team_A.map((act) => {
    return act.points;
  }).reduce((a, b) => {
    return a + b;
  });
  let score_b = Team_B.map((act) => {
    return act.points;
  }).reduce((a, b) => {
    return a + b;
  });
  collabElement1.innerHTML = teamNames[0] + "<br/>points: " + score_a;
  collabElement2.innerHTML = teamNames[1] + "<br/>points: " + score_b;

  let temp = bannerName(actor.id).join(" ");
  actor.displayElement.innerText =
    temp.length < MAX_TAG_CONTENT_LENGTH
      ? temp + ": " + actor.points
      : temp.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + "..: " + actor.points;
  actor.tailLength += actor.tailLength < MAX_TAIL_LENGTH ? growFactor : 0;
  if (
    gameModeVariables.selectedMode !== "TIME_ATTACK" &&
    gameModeVariables.selectedMode !== "COLLAB" &&
    actor.points >= gameModeVariables.winPoints
  ) {
    endGame([actor.id], actor.points, true);
  } else if (gameModeVariables.selectedMode === "COLLAB") {
    if (score_a >= gameModeVariables.winPoints) {
      endGame(["t_1"], score_a, true);
    } else if (score_b >= gameModeVariables.winPoints) {
      endGame(["t_2"], score_b, true);
    }
  } else if (actor.points >= gameModeVariables.winPoints) {
    endGame([actor.id], actor.points, true);
  }
}

function checkCollision(actor: Actor): boolean {
  if (!actor.target) return false;
  let xDiff = actor.x - actor.target.data.x;
  let yDiff = actor.y - actor.target.data.y;
  let rSquared = actor.r + actor.target.data.r;
  return xDiff * xDiff + yDiff * yDiff < rSquared * rSquared;
}

type Vector = {
  x: number;
  y: number;
};

function magnitude(v: Vector): number {
  return Math.hypot(v.x, v.y);
}

function normalizeVector(v: Vector): Vector {
  const mag = Math.hypot(v.x, v.y);
  return { x: v.x / mag, y: v.y / mag };
}

function dotProduct(v1: Vector, v2: Vector): number {
  return v1.x * v2.x + v1.y * v2.y;
}

function getProjection(v1: Vector, v2: Vector): Vector {
  const v2Unit = normalizeVector(v2);
  const dp = dotProduct(v1, v2);
  return { x: v2Unit.x * dp, y: v2Unit.y * dp };
}

function getNormalProjection(v1: Vector, v2: Vector): Vector {
  return normalizeVector(getProjection(v1, v2));
}

function asAngle(v: Vector): number {
  return Math.atan2(v.y, v.x);
}

function scaled(v: Vector, val: number): Vector {
  return { x: v.x * val, y: v.y * val };
}

function RenderNoUpdate() {
  botList.forEach((bot) => {
    bot.history.forEach((e, i) => {
      e[2] -= e[2] > bot.minSize ? decayFactor : 0;
      if (i == bot.history.length - 1)
        drawPart(e[0], e[1], e[2] + 10, bot.color, bot.borderColor);
      else if (i % TAIL_DENSITY == 0)
        drawPart(e[0], e[1], e[2], bot.color_alpha, bot.borderColor_alpha);
    });
    drawEyes(bot);
  });

  playerList.forEach((plr) => {
    plr.history.forEach((e, i) => {
      e[2] -= e[2] > plr.minSize ? decayFactor : 0;
      if (i == plr.history.length - 1)
        drawPart(e[0], e[1], e[2] + 10, plr.color, plr.borderColor);
      else if (i % TAIL_DENSITY == 0)
        drawPart(e[0], e[1], e[2], plr.color_alpha, plr.borderColor_alpha);
    });
    drawEyes(plr);
  });
}

function updatePlayerData(
  actor: Player,
  deltaTime: number,
  up = false,
  left = false,
  down = false,
  right = false
) {
  const frameFraction: number = deltaTime / 17;
  if (actor.x > canvas.width - actor.r) {
    actor.vx = -Math.abs(actor.vx);
    actor.x -= 5;
  }
  if (actor.x < actor.r) {
    actor.vx = Math.abs(actor.vx);
    actor.x += 5;
  }
  if (actor.y > canvas.height - actor.r) {
    actor.vy = -Math.abs(actor.vy);
    actor.y -= 5;
  }
  if (actor.y < actor.r) {
    actor.vy = Math.abs(actor.vy);
    actor.y += 5;
  }

  if (left || right || up || down) {
    actor.hAxis = 0;
    actor.vAxis = 0;
  }

  if ((left && !right) || (right && !left)) {
    actor.hAxis = right ? 1 : -1;
  }

  if ((down && !up) || (up && !down)) {
    actor.vAxis = down ? 1 : -1;
  }

  if (actor.hAxis !== 0 || actor.vAxis !== 0) {
    actor.targetX = actor.x + actor.hAxis * coinDistance;
    actor.targetY = actor.y + actor.vAxis * coinDistance;
  }

  const angle = Math.atan2(actor.targetY - actor.y, actor.targetX - actor.x);
  var rotateDir = angle - actor.dir;
  if (rotateDir > Math.PI) {
    rotateDir -= Math.PI * 2;
  }

  actor.dir += (rotateDir / 10) * frameFraction;

  actor.vx += Math.cos(actor.dir) * actor.linearAcc * frameFraction;
  actor.vy += Math.sin(actor.dir) * actor.linearAcc * frameFraction;

  if (
    Math.abs(actor.vx * actor.vx + actor.vy * actor.vy) >=
    DifficultySettings.plrSpeedLimit * DifficultySettings.plrSpeedLimit
  ) {
    let tempVect: Vector = { x: actor.vx, y: actor.vy };
    let finalVect: Vector = scaled(
      normalizeVector(tempVect),
      DifficultySettings.plrSpeedLimit
    );
    actor.vx = finalVect.x;
    actor.vy = finalVect.y;
  }

  actor.x += actor.vx * frameFraction;
  actor.y += actor.vy * frameFraction;
}

function updateBotData(actor: Bot, deltaTime: number): void {
  const frameFraction: number = deltaTime / 17;
  if (actor.x > canvas.width - actor.r) {
    actor.vx = -Math.abs(actor.vx);
    actor.x -= 5;
  }
  if (actor.x < actor.r) {
    actor.vx = Math.abs(actor.vx);
    actor.x += 5;
  }
  if (actor.y > canvas.height - actor.r) {
    actor.vy = -Math.abs(actor.vy);
    actor.y -= 5;
  }
  if (actor.y < actor.r) {
    actor.vy = Math.abs(actor.vy);
    actor.y += 5;
  }
  if (actor.target) {
    const angle = Math.atan2(
      actor.target.data.y - actor.y,
      actor.target.data.x - actor.x
    );
    const rotateDir = angle - actor.dir;
    if (rotateDir > 0) {
      if (actor.angularSpeed < 0)
        actor.angularSpeed += actor.angularAcc * 5 * frameFraction;
      else actor.angularSpeed += actor.angularAcc * frameFraction;
    } else if (rotateDir < 0) {
      if (actor.angularSpeed > 0)
        actor.angularSpeed -= actor.angularAcc * 5 * frameFraction;
      else actor.angularSpeed -= actor.angularAcc * frameFraction;
    }
  }

  actor.angularSpeed -= actor.angularSpeed * 0.015 * frameFraction;

  actor.dir += actor.angularSpeed * frameFraction;

  actor.vx += Math.cos(actor.dir) * actor.linearAcc * frameFraction;
  actor.vy += Math.sin(actor.dir) * actor.linearAcc * frameFraction;

  if (
    Math.abs(actor.vx * actor.vx + actor.vy * actor.vy) >=
    DifficultySettings.botSpeedLimit * DifficultySettings.botSpeedLimit
  ) {
    let tempVect: Vector = { x: actor.vx, y: actor.vy };
    let finalVect: Vector = scaled(
      normalizeVector(tempVect),
      DifficultySettings.botSpeedLimit
    );
    actor.vx = finalVect.x;
    actor.vy = finalVect.y;
  }

  actor.x += actor.vx * frameFraction;
  actor.y += actor.vy * frameFraction;

  if (actor.target) {
    actor.tongueOut =
      actor.distanceTo(actor.target) < tongueRadius * tongueRadius;
  }
}

function drawPart(
  x: number,
  y: number,
  r: number,
  color: string,
  border: string
) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

function drawEyes(actor: Actor) {
  const pointX1 = actor.x + Math.cos(actor.dir + Math.PI / 4) * actor.r * 0.7;
  const pointY1 = actor.y + Math.sin(actor.dir + Math.PI / 4) * actor.r * 0.7;

  const pointX11 =
    actor.x + Math.cos(actor.dir + Math.PI / 3 + 0.1) * actor.r * 0.62;
  const pointY11 =
    actor.y + Math.sin(actor.dir + Math.PI / 3 + 0.1) * actor.r * 0.62;

  const pointX2 = actor.x + Math.cos(actor.dir - Math.PI / 4) * actor.r * 0.7;
  const pointY2 = actor.y + Math.sin(actor.dir - Math.PI / 4) * actor.r * 0.7;

  const pointX21 =
    actor.x + Math.cos(actor.dir - Math.PI / 3 - 0.1) * actor.r * 0.62;
  const pointY21 =
    actor.y + Math.sin(actor.dir - Math.PI / 3 - 0.1) * actor.r * 0.62;

  //TODO: ADD DYNAMIC TONGUE MODEL

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pointX11, pointY11, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.arc(pointX21, pointY21, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(pointX1, pointY1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.arc(pointX2, pointY2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  //drawing nametag
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  const temp = bannerName(actor.id);
  const tagStr =
    temp[0] === "(Bot)"
      ? temp.join(" ")
      : temp[0] === "(Player)"
      ? temp.join(" ")
      : temp[1];
  const tagStrAdjusted =
    tagStr.length > MAX_TAG_CONTENT_LENGTH
      ? tagStr.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + ".."
      : tagStr;
  const widthAdjusted = tagStrAdjusted.length * 10;
  ctx.roundRect(
    actor.x - widthAdjusted / 2,
    actor.y - NAMETAG_OFFSET,
    widthAdjusted,
    NAMETAG_HEIGHT,
    5
  );
  ctx.fill();
  ctx.closePath();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 20px Arial";
  ctx.fillStyle =
    gameModeVariables.selectedMode === "COLLAB" ? actor.tagColor : actor.color;
  ctx.fillText(
    tagStrAdjusted,
    actor.x,
    actor.y - NAMETAG_OFFSET + NAMETAG_HEIGHT / 2
  );
}

function drawCoin(x: number, y: number, useShadow = true) {
  ctx.fillStyle = useShadow ? coinShadowColors[0] : COIN_FILL_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, coinR, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
  ctx.fillStyle = useShadow ? coinShadowColors[1] : "rgb(202,153,10)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 30px Arial";
  ctx.fillText("\u2605", x, y);

  //outline
  ctx.strokeStyle = "rgb(202,153,10)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, coinR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.closePath();
}

var frameCounter = 0;

function collisionResponse(a: Actor, b: Actor) {
  const relVector = <Vector>{ x: b.x - a.x, y: b.y - a.y };
  const relAngle = Math.atan2(relVector.y, relVector.x);
  const _unit1 = normalizeVector(relVector);
  const _unit2 = <Vector>{ x: -_unit1.x, y: -_unit1.y };
  const v1 = <Vector>{ x: a.vx, y: a.vy };
  const v2 = <Vector>{ x: b.vx, y: b.vy };
  const p1 = getProjection(v1, _unit1);
  const p2 = getProjection(v2, _unit2);
  if (
    Math.round(Math.sin(asAngle(p1) - relAngle)) == 0 ||
    Math.round(Math.sin(asAngle(p2) + (Math.PI - relAngle))) == 0
  ) {
    // const sameDir = Math.round(Math.sin(asAngle(p1) - asAngle(p2))) == 0;
    const aMod =
      Math.round(Math.sin(Math.abs(a.dir - relAngle))) < Math.PI ? -1 : 1;
    const bMod =
      Math.round(Math.sin(Math.abs(b.dir - relAngle))) < Math.PI ? 1 : -1;

    a.vx += (aMod * COLLISION_MIN * (p2.x * b.mass)) / a.mass;
    a.vy += (aMod * COLLISION_MIN * (p2.y * b.mass)) / a.mass;
    a.dir = relAngle + Math.PI;
    a.x += Math.cos(a.dir) * 2;
    a.y += Math.sin(a.dir) * 2;

    b.vx += (bMod * COLLISION_MIN * (p1.x * a.mass)) / b.mass;
    b.vy += (bMod * COLLISION_MIN * (p1.y * a.mass)) / b.mass;
    b.dir = relAngle;
    b.x += Math.cos(b.dir) * 2;
    b.y += Math.sin(b.dir) * 2;
  }
}

function manageCollisions() {
  for (let i = 0; i < botList.length - 1; i++) {
    for (let j = i + 1; j < botList.length; j++) {
      if (j === i) continue;
      else {
        const bot1 = botList[i];
        const bot2 = botList[j];
        if (Math.hypot(bot1.x - bot2.x, bot1.y - bot2.y) <= 2 * defaultR + 20) {
          collisionResponse(bot1, bot2);
        }
      }
    }
  }

  for (let i = 0; i < playerList.length - 1; i++) {
    for (let j = i + 1; j < playerList.length; j++) {
      if (j === i) continue;
      else {
        const plr1 = playerList[i];
        const plr2 = playerList[j];
        if (Math.hypot(plr2.x - plr1.x, plr2.y - plr1.y) <= 2 * defaultR + 20) {
          collisionResponse(plr1, plr2);
        }
      }
    }
  }

  for (let i = 0; i < playerList.length; i++) {
    for (let j = 0; j < botList.length; j++) {
      const plr = playerList[i];
      const bot = botList[j];
      if (Math.hypot(bot.x - plr.x, bot.y - plr.y) <= 2 * defaultR + 20) {
        collisionResponse(plr, bot);
      }
    }
  }
}

let updateExtra: number = 0;

function progressGameLogic(deltaTime: number): void {
  manageCollisions();

  botList.forEach((bot) => {
    updateBotData(bot, deltaTime);
  });
  playerList.forEach((plr) => {
    updatePlayerData(
      plr,
      deltaTime,
      ...plr.inputBindings.map((key) => pressedKeys.has(key))
    );
  });

  botList.forEach((bot) => {
    if (bot.history.length > bot.tailLength)
      bot.history = [...bot.history.slice(1)];
    else if (bot.history.length === bot.tailLength)
      bot.history = [...bot.history.slice(1), [bot.x, bot.y, bot.r]];
    else bot.history.push([bot.x, bot.y, bot.r]);
  });

  playerList.forEach((plr) => {
    if (plr.history.length > plr.tailLength)
      plr.history = [...plr.history.slice(1)];
    else if (plr.history.length === plr.tailLength)
      plr.history = [...plr.history.slice(1), [plr.x, plr.y, plr.r]];
    else plr.history.push([plr.x, plr.y, plr.r]);
  });

  playerList.forEach((plr) => {
    if (checkCollision(plr)) {
      addScore(plr);
    }
  });

  botList.forEach((bot) => {
    if (checkCollision(bot)) {
      addScore(bot);
    }
  });
}

function update(deltaTime: number) {
  if (++frameCounter >= updateInterval) {
    frameCounter = 0;
    playerList.forEach((plr) => {
      plr.targetUpdate();
    });
    botList.forEach((bot) => {
      bot.targetUpdate();
    });
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  progressGameLogic(deltaTime);

  if (DEBUG)
    coinHistory.forEach((e) => {
      drawCoin(e[0], e[1], true);
    });

  coinList.forEach((coin) => {
    drawCoin(coin.data.x, coin.data.y, false);
  });
  if (particlesEnabled) updateCoinParticles();
}

let millisecondsPassed: number = 0;
let oldTimeStamp: number = 0;

function gameLoop(timeStamp: number = 0) {
  millisecondsPassed = timeStamp - oldTimeStamp;
  oldTimeStamp = timeStamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  update(Math.max(Math.min(millisecondsPassed, 200), 8));
  RenderNoUpdate();

  if (!gameEnded) requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameOverPrompt.classList.remove("visible");

  playerList.forEach((plr) => {
    plr.points = 0;
    plr.tailLength = MIN_TAIL_LENGTH;
    plr.history = plr.history.slice(plr.history.length - plr.tailLength);
    let temp = bannerName(plr.id).join(" ");
    plr.displayElement.innerText =
      temp.length < MAX_TAG_CONTENT_LENGTH
        ? temp + ": 0"
        : temp.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + "..: 0";
  });

  botList.forEach((bot) => {
    bot.points = 0;
    bot.tailLength = MIN_TAIL_LENGTH;
    bot.history = bot.history.slice(bot.history.length - bot.tailLength);
    let temp = bannerName(bot.id).join(" ");
    bot.displayElement.innerText =
      temp.length < MAX_TAG_CONTENT_LENGTH
        ? temp + ": 0"
        : temp.slice(0, MAX_TAG_CONTENT_LENGTH - 2) + "..: 0";
  });
  gameModeController.resetSettings();
  // gameEnded = true; //change when adding end game settings break
  // update();
  start();
}

replayButton.onclick = resetGame;

function addActor(
  isBot: boolean,
  name: string,
  team: number,
  mass?: number,
  color?: string,
  borderColor?: string,
  inputBindings?: string[]
): void {
  let tempColor: string;
  let tempBorder: string;
  if (color !== undefined) {
    if (borderColor !== undefined) {
      tempColor = color;
      tempBorder = borderColor;
    } else {
      const colorSet = selectColors();
      tempColor = colorSet[0];
      tempBorder = colorSet[1];
    }
  } else {
    const colorSet = selectColors();
    tempColor = colorSet[0];
    tempBorder = colorSet[1];
  }
  let tempMass: number;
  if (mass) tempMass = Math.max(mass, REFERENCE_MASS);
  else tempMass = REFERENCE_MASS;
  if (isBot) {
    botNames.push(name);
    const myActor = new Bot(team, tempColor, tempBorder, tempMass);
    botList.push(myActor);
    if (team === 1) {
      Team_A.push(myActor);
    } else {
      Team_B.push(myActor);
    }
  } else if (inputBindings) {
    playerNames.push(name);
    const myActor = new Player(
      inputBindings,
      team,
      tempColor,
      tempBorder,
      tempMass
    );
    playerList.push(myActor);
    if (team === 1) {
      Team_A.push(myActor);
    } else {
      Team_B.push(myActor);
    }
  } else {
    console.log("Error creating player: no input bindings specified");
  }
}

type ActorTicket =
  | {
      isBot: true;
      name: string;
      team: number;
      mass?: number;
      color?: string;
      borderColor?: string;
      inputBindings?: string[] | undefined;
    }
  | {
      isBot: false;
      name: string;
      team: number;
      mass?: number;
      color?: string;
      borderColor?: string;
      inputBindings: string[];
    };

const TicketList: ActorTicket[] = [];

function Ticketify(
  isBot: boolean,
  name: string,
  team: number,
  mass?: number,
  color?: string,
  borderColor?: string,
  inputBindings?: string[]
): void {
  TicketList.push(<ActorTicket>{
    isBot: isBot,
    name: name,
    team: team,
    mass: mass,
    inputBindings: inputBindings,
    color: color,
    borderColor: borderColor,
  });
}

// Ticketify(true, "asimov", 1, 10);
Ticketify(true, "Tesla", 1);
Ticketify(true, "Atlas", 2);
Ticketify(false, "Beta_Tester 2", 2, undefined, undefined, undefined, [
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
]);
Ticketify(false, "Beta_Tester 1", 1, undefined, undefined, undefined, [
  "w",
  "a",
  "s",
  "d",
]);

function init(): void {
  while (TicketList.length > 0) {
    const t = TicketList.pop()!;
    addActor(
      t.isBot,
      t.name,
      t.team,
      t.mass,
      t.color,
      t.borderColor,
      t.inputBindings
    );
  }
  gameEnded = true;
  // gameLoop();
  start();
}

function start(): void {
  gameModeController.setGameMode(gameModeVariables.selectedMode);
  gameEnded = false;
  gameLoop();
}

window.addEventListener("resize", () => {
  canvas.width =
    window.innerWidth > 1200
      ? window.innerWidth
      : window.innerWidth > 1000
      ? window.innerWidth * 1.2
      : window.innerWidth > 800
      ? window.innerWidth * 1.5
      : window.innerWidth * 2;
  canvas.height =
    window.innerWidth > 1200
      ? window.innerHeight
      : window.innerWidth > 1000
      ? window.innerHeight * 1.2
      : window.innerWidth > 800
      ? window.innerHeight * 1.5
      : window.innerHeight * 2;
  coinList.forEach((coin) => {
    if (
      !(
        canvasMargin < coin.data.x && coin.data.x < canvas.width - canvasMargin
      ) ||
      !(
        canvasMargin < coin.data.y && coin.data.y < canvas.height - canvasMargin
      )
    ) {
      updateCoin(coin);
    }
  });
  RenderNoUpdate();
});

//PROGRAM START CALL (DO NOT REMOVE)
init();
