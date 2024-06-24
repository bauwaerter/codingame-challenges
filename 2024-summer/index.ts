/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

const myPlayerIdx: number = parseInt(readline());
const enemyPlayer1Idx: number = (myPlayerIdx + 1) % 3;
const enemyPlayer2Idx: number = (myPlayerIdx + 2) % 3;
const nbGames: number = parseInt(readline());

const TOTAL_TURNS = 100;
let turn = 1;

class MedalCounts {
  gold: number;
  silver: number;
  bronze: number;

  constructor(gold: number, silver: number, bronze: number) {
    this.gold = gold;
    this.silver = silver;
    this.bronze = bronze;
  }

  get totalMedals(): number {
    return this.gold + this.silver + this.bronze;
  }

  hasGoldOrSilver(): boolean {
    return this.gold > 0 || this.silver > 0;
  }

  addGoldMedal() {
    this.gold++;
  }

  addSilverMedal() {
    this.silver++;
  }

  addBronzeMedal() {
    this.bronze++;
  }
}

class PlayerScoreKeeper {
  hurdleMedals: MedalCounts;
  archeryMedals: MedalCounts;
  rollerSkateMedals: MedalCounts;
  divingMedals: MedalCounts;

  constructor() {
    this.hurdleMedals = new MedalCounts(0, 0, 0);
    this.archeryMedals = new MedalCounts(0, 0, 0);
    this.rollerSkateMedals = new MedalCounts(0, 0, 0);
    this.divingMedals = new MedalCounts(0, 0, 0);
  }

  get totalGoldMedals(): number {
    return (
      this.hurdleMedals.gold +
      this.archeryMedals.gold +
      this.rollerSkateMedals.gold +
      this.divingMedals.gold
    );
  }

  get totalSilverMedals(): number {
    return (
      this.hurdleMedals.silver +
      this.archeryMedals.silver +
      this.rollerSkateMedals.silver +
      this.divingMedals.silver
    );
  }

  get currentScore(): number {
    return this.totalSilverMedals + this.totalGoldMedals * 3;
  }
}

class ScoreKeeper {
  scores: { [key: number]: PlayerScoreKeeper };

  constructor() {
    this.scores = {
      [myPlayerIdx]: new PlayerScoreKeeper(),
      [enemyPlayer1Idx]: new PlayerScoreKeeper(),
      [enemyPlayer2Idx]: new PlayerScoreKeeper(),
    };
  }

  get myPlayerScore(): PlayerScoreKeeper {
    return this.scores[myPlayerIdx];
  }

  get enemyPlayer1Score(): PlayerScoreKeeper {
    return this.scores[enemyPlayer1Idx];
  }

  get enemyPlayer2Score(): PlayerScoreKeeper {
    return this.scores[enemyPlayer2Idx];
  }

  updateHurdleScores(gameState: HurdleGameState) {
    if (!gameState.isGameOver) {
      return;
    }

    const placements = gameState.calculatePlacements();
    for (const playerIdx in placements) {
      switch (placements[playerIdx]) {
        case 1:
          this.scores[playerIdx].hurdleMedals.addGoldMedal();
          break;
        case 2:
          this.scores[playerIdx].hurdleMedals.addSilverMedal();
          break;
        case 3:
          this.scores[playerIdx].hurdleMedals.addBronzeMedal();
          break;
      }
    }
  }

  updateArcheryScores(gameState: ArcheryGameState) {
    if (!gameState.isGameOver) {
      return;
    }

    const placements = gameState.calculatePlacements();
    for (const playerIdx in placements) {
      switch (placements[playerIdx]) {
        case 1:
          this.scores[playerIdx].archeryMedals.addGoldMedal();
          break;
        case 2:
          this.scores[playerIdx].archeryMedals.addSilverMedal();
          break;
        case 3:
          this.scores[playerIdx].archeryMedals.addBronzeMedal();
          break;
      }
    }
  }

  updateRollerSkateScores(gameState: RollerSkateGameState) {
    if (!gameState.isGameOver) {
      return;
    }

    const placements = gameState.calculatePlacements();
    for (const playerIdx in placements) {
      switch (placements[playerIdx]) {
        case 1:
          this.scores[playerIdx].rollerSkateMedals.addGoldMedal();
          break;
        case 2:
          this.scores[playerIdx].rollerSkateMedals.addSilverMedal();
          break;
        case 3:
          this.scores[playerIdx].rollerSkateMedals.addBronzeMedal();
          break;
      }
    }
  }

  updateDivingScores(gameState: DivingGameState) {
    if (!gameState.isGameOver) {
      return;
    }

    const placements = gameState.calculatePlacements();
    for (const playerIdx in placements) {
      switch (placements[playerIdx]) {
        case 1:
          this.scores[playerIdx].divingMedals.addGoldMedal();
          break;
        case 2:
          this.scores[playerIdx].divingMedals.addSilverMedal();
          break;
        case 3:
          this.scores[playerIdx].divingMedals.addBronzeMedal();
          break;
      }
    }
  }
}

const scoreKeeper = new ScoreKeeper();

const MOVES = {
  LEFT: "LEFT",
  DOWN: "DOWN",
  RIGHT: "RIGHT",
  UP: "UP",
} as const;

class Weight {
  static readonly Best = 0;
  static readonly Good = 1;
  static readonly Bad = 2;
  static readonly Worst = 3;

  static getStunnedWeight(stunTimer: number): number {
    return stunTimer * 1.5;
  }

  static weightMoves({
    moves,
    turnsLeft,
    currentPlacement,
    hasGoldMedal,
    hasSilverMedal,
  }: {
    moves: { [key in keyof typeof MOVES]: number };
    turnsLeft: number;
    currentPlacement: number;
    hasGoldMedal: boolean;
    hasSilverMedal: boolean;
  }): { [key in keyof typeof MOVES]: number } {
    for (const [key, value] of Object.entries(moves)) {
      moves[key] = value + (hasGoldMedal ? 3 : -7);
      // moves[key] = value;
    }
    return moves;
  }
}

type GameStateArgs = {
  gpu: string;
  turn: number;
};

abstract class GameState {
  gpu: string;
  turn: number;

  constructor(gpu: string, turn: number) {
    this.gpu = gpu;
    this.turn = turn;
  }

  abstract get turnsLeftInGame(): number;

  get isGameOver(): boolean {
    return this.gpu === "GAME_OVER";
  }

  get turnsLeft(): number {
    return TOTAL_TURNS - this.turn;
  }

  get myCurrentPlacement(): number {
    const placements = this.calculatePlacements();
    return placements[myPlayerIdx];
  }

  isLastPlace(): boolean {
    const placements = this.calculatePlacements();
    return placements[myPlayerIdx] === 3;
  }

  abstract hasGoldMedal(): boolean;
  abstract hasSilverMedal(): boolean;
  abstract canFinishGame(): boolean;
  abstract calculateNextMove(): { [key in keyof typeof MOVES]: number } | null;
  abstract calculatePlacements(): { [key: number]: number };
}

type HurdleGameStateArgs = GameStateArgs & {
  map: string;
  position1: number;
  position2: number;
  position3: number;
  stunTimer1: number;
  stunTimer2: number;
  stunTimer3: number;
};

class HurdleActor {
  position: number;
  stunTimer: number;
  constructor(position: number, stunTimer: number) {
    this.position = position;
    this.stunTimer = stunTimer;
  }
}

class HurdleGameState extends GameState {
  private MAP_LENGTH = 30;
  private STUN_TIMER = 3 * 2;
  map: string;
  myPlayer: HurdleActor;
  enemyPlayer1: HurdleActor;
  enemyPlayer2: HurdleActor;

  constructor(gameState: HurdleGameStateArgs) {
    super(gameState.gpu, gameState.turn);
    const allPlayerPositions = [
      gameState.position1,
      gameState.position2,
      gameState.position3,
    ];
    const allStunTimers = [
      gameState.stunTimer1,
      gameState.stunTimer2,
      gameState.stunTimer3,
    ];
    const myPlayerPosition = allPlayerPositions[myPlayerIdx];
    const myPlayerStunTimer = allStunTimers[myPlayerIdx];
    const enemyPlayer1Position = allPlayerPositions[enemyPlayer1Idx];
    const enemyPlayer1StunTimer = allStunTimers[enemyPlayer1Idx];
    const enemyPlayer2Position = allPlayerPositions[enemyPlayer2Idx];
    const enemyPlayer2StunTimer = allStunTimers[enemyPlayer2Idx];

    this.myPlayer = new HurdleActor(myPlayerPosition, myPlayerStunTimer);
    this.enemyPlayer1 = new HurdleActor(
      enemyPlayer1Position,
      enemyPlayer1StunTimer
    );
    this.enemyPlayer2 = new HurdleActor(
      enemyPlayer2Position,
      enemyPlayer2StunTimer
    );

    this.map = gameState.map.slice(myPlayerPosition, gameState.map.length);
  }

  get turnsLeftInGame(): number {
    return this.MAP_LENGTH - this.myPlayer.position;
  }

  get currentlyStunned(): boolean {
    return this.myPlayer.stunTimer > 0;
  }

  get distanceToFinishLine(): number {
    return this.MAP_LENGTH - this.myPlayer.position;
  }

  get numHurdles(): number {
    return this.map.split("#").length - 1;
  }

  hasGoldMedal(): boolean {
    return scoreKeeper.myPlayerScore.hurdleMedals.gold > 0;
  }

  hasSilverMedal(): boolean {
    return scoreKeeper.myPlayerScore.hurdleMedals.silver > 0;
  }

  canFinishGame(): boolean {
    const moves = this.calculateMoves();
    if (!moves) {
      return false;
    }
    return this.turnsLeft >= moves.length;
  }

  calculatePlacements() {
    const leader = Math.max(
      this.myPlayer.position,
      this.enemyPlayer1.position,
      this.enemyPlayer2.position
    );

    const middle = Math.max(
      Math.min(this.myPlayer.position, this.enemyPlayer1.position),
      Math.min(this.myPlayer.position, this.enemyPlayer2.position),
      Math.min(this.enemyPlayer1.position, this.enemyPlayer2.position)
    );

    const loser = Math.min(
      this.myPlayer.position,
      this.enemyPlayer1.position,
      this.enemyPlayer2.position
    );

    const currentPositions = {
      [myPlayerIdx]: this.myPlayer.position,
      [enemyPlayer1Idx]: this.enemyPlayer1.position,
      [enemyPlayer2Idx]: this.enemyPlayer2.position,
    };

    const getCurrentPlacement = (playerIdx: number) => {
      if (currentPositions[playerIdx] === leader) {
        return 1;
      } else if (currentPositions[playerIdx] === middle) {
        return 2;
      } else if (currentPositions[playerIdx] === loser) {
        return 3;
      } else {
        return 3;
      }
    };

    return {
      [myPlayerIdx]: getCurrentPlacement(myPlayerIdx),
      [enemyPlayer1Idx]: getCurrentPlacement(enemyPlayer1Idx),
      [enemyPlayer2Idx]: getCurrentPlacement(enemyPlayer2Idx),
    };
  }

  calculateMoves() {
    const moves: { RIGHT: number; LEFT: number; UP: number; DOWN: number }[] =
      [];
    if (this.isGameOver) {
      return null;
    }

    let tempMap = this.map;
    while (tempMap.length > 0) {
      const nextHurdleIndex =
        tempMap.indexOf("#") === 0
          ? tempMap.indexOf("#", 1)
          : tempMap.indexOf("#");
      if (nextHurdleIndex === -1) {
        tempMap = tempMap.slice(3);
      } else if (nextHurdleIndex > 3) {
        tempMap = tempMap.slice(3);
      } else if (nextHurdleIndex > 2) {
        tempMap = tempMap.slice(2);
      } else if (nextHurdleIndex > 1) {
        tempMap = tempMap.slice(1);
      } else if (nextHurdleIndex === -1) {
        tempMap = tempMap.slice(2);
      } else {
        console.error(`Error2: ${tempMap}`);
      }
    }

    return moves;
  }

  getDistanceToFinishLine(spacesTravelled: number) {
    return this.MAP_LENGTH - (this.myPlayer.position + spacesTravelled);
  }

  getWeight(spacesTravelled: number) {
    return this.map.length < spacesTravelled
      ? this.map.length * -1
      : spacesTravelled * -1;
  }

  calculateNextMove() {
    if (this.isGameOver) {
      return null;
    }
    const nextHurdleIndex =
      this.map.indexOf("#") === 0
        ? this.map.indexOf("#", 1)
        : this.map.indexOf("#");
    if (nextHurdleIndex === -1 || nextHurdleIndex > 3) {
      return {
        [MOVES.RIGHT]: this.getWeight(3),
        [MOVES.LEFT]: this.getWeight(1),
        [MOVES.UP]: this.getWeight(2),
        [MOVES.DOWN]: this.getWeight(2),
      };
    } else if (nextHurdleIndex > 2) {
      return {
        [MOVES.RIGHT]: Weight.getStunnedWeight(this.STUN_TIMER),
        [MOVES.LEFT]: this.getWeight(1),
        [MOVES.UP]: this.getWeight(2),
        [MOVES.DOWN]: this.getWeight(2),
      };
    } else if (nextHurdleIndex > 1) {
      return {
        [MOVES.RIGHT]: Weight.getStunnedWeight(this.STUN_TIMER),
        [MOVES.LEFT]: this.getWeight(1),
        [MOVES.UP]: Weight.getStunnedWeight(this.STUN_TIMER),
        [MOVES.DOWN]: Weight.getStunnedWeight(this.STUN_TIMER),
      };
    } else if (nextHurdleIndex === 1) {
      return {
        [MOVES.RIGHT]: Weight.getStunnedWeight(this.STUN_TIMER),
        [MOVES.LEFT]: Weight.getStunnedWeight(this.STUN_TIMER),
        [MOVES.UP]: this.getWeight(2),
        [MOVES.DOWN]: Weight.getStunnedWeight(this.STUN_TIMER),
      };
    } else {
      console.error(`Error: ${this.map}`);
      // return {
      //   [MOVES.RIGHT]: 0,
      //   [MOVES.LEFT]: 0,
      //   [MOVES.UP]: 0,
      //   [MOVES.DOWN]: 0,
      // };
    }

    return null;
  }
}

type ArcheryGameStateArgs = GameStateArgs & {
  windPower: string;
  player1X: number;
  player1Y: number;
  player2X: number;
  player2Y: number;
  player3X: number;
  player3Y: number;
};

const euclideanDistanceToCenter = (x: number, y: number) => {
  const centerX = 0;
  const centerY = 0;
  return Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
};

class ArcheryActor {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get distance(): number {
    return euclideanDistanceToCenter(this.x, this.y);
  }
}

class ArcheryGameState extends GameState {
  windPower: string;
  myPlayer: ArcheryActor;
  enemyPlayer1: ArcheryActor;
  enemyPlayer2: ArcheryActor;

  constructor(gameState: ArcheryGameStateArgs) {
    super(gameState.gpu, gameState.turn);
    const allPlayerPositions = [
      [gameState.player1X, gameState.player1Y],
      [gameState.player2X, gameState.player2Y],
      [gameState.player3X, gameState.player3Y],
    ];

    this.myPlayer = new ArcheryActor(
      allPlayerPositions[myPlayerIdx][0],
      allPlayerPositions[myPlayerIdx][1]
    );
    this.enemyPlayer1 = new ArcheryActor(
      allPlayerPositions[enemyPlayer1Idx][0],
      allPlayerPositions[enemyPlayer1Idx][1]
    );
    this.enemyPlayer2 = new ArcheryActor(
      allPlayerPositions[enemyPlayer2Idx][0],
      allPlayerPositions[enemyPlayer2Idx][1]
    );

    this.windPower = gameState.windPower;
  }

  get turnsLeftInGame(): number {
    return this.windPower.length;
  }

  hasGoldMedal(): boolean {
    return scoreKeeper.myPlayerScore.archeryMedals.gold > 0;
  }

  hasSilverMedal(): boolean {
    return scoreKeeper.myPlayerScore.archeryMedals.silver > 0;
  }

  canFinishGame(): boolean {
    return this.turnsLeft >= this.windPower.length;
  }

  calculatePlacements(): { [key: number]: number } {
    const leader = Math.min(
      this.myPlayer.distance,
      this.enemyPlayer1.distance,
      this.enemyPlayer2.distance
    );

    const middle = Math.min(
      Math.max(this.myPlayer.distance, this.enemyPlayer1.distance),
      Math.max(this.myPlayer.distance, this.enemyPlayer2.distance),
      Math.max(this.enemyPlayer1.distance, this.enemyPlayer2.distance)
    );

    const loser = Math.max(
      this.myPlayer.distance,
      this.enemyPlayer1.distance,
      this.enemyPlayer2.distance
    );

    const currentPositions = {
      [myPlayerIdx]: this.myPlayer.distance,
      [enemyPlayer1Idx]: this.enemyPlayer1.distance,
      [enemyPlayer2Idx]: this.enemyPlayer2.distance,
    };

    const getCurrentPlacement = (playerIdx: number) => {
      if (currentPositions[playerIdx] === leader) {
        return 1;
      } else if (currentPositions[playerIdx] === middle) {
        return 2;
      } else if (currentPositions[playerIdx] === loser) {
        return 3;
      } else {
        return 3;
      }
    };

    return {
      [myPlayerIdx]: getCurrentPlacement(myPlayerIdx),
      [enemyPlayer1Idx]: getCurrentPlacement(enemyPlayer1Idx),
      [enemyPlayer2Idx]: getCurrentPlacement(enemyPlayer2Idx),
    };
  }

  getForecastedPlacement(
    myDistance: number,
    enemy1Distance: number,
    enemy2Distance: number
  ) {
    if (myDistance <= enemy1Distance && myDistance <= enemy2Distance) {
      return 3;
    } else if (myDistance <= enemy1Distance || myDistance <= enemy2Distance) {
      return 0;
    } else {
      return -5;
    }
  }

  shouldCalculateNextMove() {
    let total = 0;
    let rightIndex = this.windPower.length - 1;
    let moveNumber = 1;
    while (total <= 20 && rightIndex >= 0) {
      total += parseInt(this.windPower.charAt(rightIndex));
      rightIndex--;
      moveNumber++;
    }
    return moveNumber >= this.turnsLeftInGame;
  }

  calculateNextMove() {
    if (this.isGameOver) {
      return null;
    }

    const currentWindPower = parseInt(this.windPower.charAt(0));
    if (!Number.isFinite(currentWindPower)) {
      return null;
    }

    const currentDistance = euclideanDistanceToCenter(
      this.myPlayer.x,
      this.myPlayer.y
    );
    const myMoveRightDistance = euclideanDistanceToCenter(
      this.myPlayer.x + currentWindPower,
      this.myPlayer.y
    );
    const myMoveLeftDistance = euclideanDistanceToCenter(
      currentWindPower - this.myPlayer.x,
      this.myPlayer.y
    );
    const myMoveUpDistance = euclideanDistanceToCenter(
      this.myPlayer.x,
      currentWindPower - this.myPlayer.y
    );
    const myMoveDownDistance = euclideanDistanceToCenter(
      this.myPlayer.x,
      this.myPlayer.y + currentWindPower
    );

    const minDistance = Math.min(
      currentDistance,
      myMoveRightDistance,
      myMoveLeftDistance,
      myMoveUpDistance,
      myMoveDownDistance
    );

    if (minDistance === currentDistance) {
      return null;
    }

    // const enemyPlayer1MoveRightDistance = euclideanDistanceToCenter(
    //   this.enemyPlayer1.x + currentWindPower,
    //   this.enemyPlayer1.y
    // );
    // const enemyPlayer1MoveLeft = euclideanDistanceToCenter(
    //   currentWindPower - this.enemyPlayer1.x,
    //   this.enemyPlayer1.y
    // );
    // const enemyPlayer1MoveUp = euclideanDistanceToCenter(
    //   this.enemyPlayer1.x,
    //   currentWindPower - this.enemyPlayer1.y
    // );
    // const enemyPlayer1MoveDown = euclideanDistanceToCenter(
    //   this.enemyPlayer1.x,
    //   this.enemyPlayer1.y + currentWindPower
    // );
    // const enemy1ClosestDistance = Math.min(
    //   enemyPlayer1MoveRightDistance,
    //   enemyPlayer1MoveLeft,
    //   enemyPlayer1MoveUp,
    //   enemyPlayer1MoveDown
    // );

    // const enemyPlayer2MoveRightDistance = euclideanDistanceToCenter(
    //   this.enemyPlayer2.x + currentWindPower,
    //   this.enemyPlayer2.y
    // );
    // const enemyPlayer2MoveLeft = euclideanDistanceToCenter(
    //   currentWindPower - this.enemyPlayer2.x,
    //   this.enemyPlayer2.y
    // );
    // const enemyPlayer2MoveUp = euclideanDistanceToCenter(
    //   this.enemyPlayer2.x,
    //   currentWindPower - this.enemyPlayer2.y
    // );
    // const enemyPlayer2MoveDown = euclideanDistanceToCenter(
    //   this.enemyPlayer2.x,
    //   this.enemyPlayer2.y + currentWindPower
    // );
    // const enemy2ClosestDistance = Math.min(
    //   enemyPlayer2MoveRightDistance,
    //   enemyPlayer2MoveLeft,
    //   enemyPlayer2MoveUp,
    //   enemyPlayer2MoveDown
    // );

    // const moves = {
    //   [MOVES.RIGHT]: this.getForecastedPlacement(
    //     myMoveRightDistance,
    //     enemy1ClosestDistance,
    //     enemy2ClosestDistance
    //   ),
    //   [MOVES.LEFT]: this.getForecastedPlacement(
    //     myMoveLeftDistance,
    //     enemy1ClosestDistance,
    //     enemy2ClosestDistance
    //   ),
    //   [MOVES.UP]: this.getForecastedPlacement(
    //     myMoveUpDistance,
    //     enemy1ClosestDistance,
    //     enemy2ClosestDistance
    //   ),
    //   [MOVES.DOWN]: this.getForecastedPlacement(
    //     myMoveDownDistance,
    //     enemy1ClosestDistance,
    //     enemy2ClosestDistance
    //   ),
    // };

    const moves = {
      [MOVES.RIGHT]: myMoveRightDistance,
      [MOVES.LEFT]: myMoveLeftDistance,
      [MOVES.UP]: myMoveUpDistance,
      [MOVES.DOWN]: myMoveDownDistance,
    };

    console.error(`windPower: ${this.windPower}`);
    console.error(`Moves: ${JSON.stringify(moves)}`);

    return moves;
  }
}

type RollerSkateGameStateArgs = GameStateArgs & {
  riskOrder: string;
  skatingTurnsLeft: number;
  player1SpacesTravelled: number;
  player2SpacesTravelled: number;
  player3SpacesTravelled: number;
  player1RiskOrStunTimer: number;
  player2RiskOrStunTimer: number;
  player3RiskOrStunTimer: number;
};

class RollerSkateActor {
  spacesTravelled: number;
  riskOrStunTimer: number;
  constructor(spacesTravelled: number, riskOrStunTimer: number) {
    this.spacesTravelled = spacesTravelled;
    this.riskOrStunTimer = riskOrStunTimer;
  }

  isStunned(): boolean {
    return this.riskOrStunTimer < 0;
  }
}

class RollerSkateGameState extends GameState {
  private STUN_TIMER = 2;
  riskOrder: string;
  skatingTurnsLeft: number;
  myPlayer: RollerSkateActor;
  enemyPlayer1: RollerSkateActor;
  enemyPlayer2: RollerSkateActor;
  costOfRisk = [-1, 0, 1, 2];
  riskSpacesTravelled = [1, 2, 2, 3];
  MAX_RISK_ALLOWED = 5;

  constructor(gameState: RollerSkateGameStateArgs) {
    super(gameState.gpu, gameState.turn);

    this.skatingTurnsLeft = gameState.skatingTurnsLeft;

    const allPlayerPositions = [
      gameState.player1SpacesTravelled,
      gameState.player2SpacesTravelled,
      gameState.player3SpacesTravelled,
    ];
    const allStunTimers = [
      gameState.player1RiskOrStunTimer,
      gameState.player2RiskOrStunTimer,
      gameState.player3RiskOrStunTimer,
    ];
    const myPlayerPosition = allPlayerPositions[myPlayerIdx];
    const myPlayerStunTimer = allStunTimers[myPlayerIdx];
    const enemyPlayer1Position = allPlayerPositions[enemyPlayer1Idx];
    const enemyPlayer1StunTimer = allStunTimers[enemyPlayer1Idx];
    const enemyPlayer2Position = allPlayerPositions[enemyPlayer2Idx];
    const enemyPlayer2StunTimer = allStunTimers[enemyPlayer2Idx];

    this.myPlayer = new RollerSkateActor(myPlayerPosition, myPlayerStunTimer);
    this.enemyPlayer1 = new RollerSkateActor(
      enemyPlayer1Position,
      enemyPlayer1StunTimer
    );
    this.enemyPlayer2 = new RollerSkateActor(
      enemyPlayer2Position,
      enemyPlayer2StunTimer
    );

    this.riskOrder = gameState.riskOrder;
  }

  get turnsLeftInGame(): number {
    return this.skatingTurnsLeft;
  }

  hasGoldMedal(): boolean {
    return scoreKeeper.myPlayerScore.rollerSkateMedals.gold > 0;
  }

  hasSilverMedal(): boolean {
    return scoreKeeper.myPlayerScore.rollerSkateMedals.silver > 0;
  }

  canFinishGame(): boolean {
    return this.turnsLeft >= this.skatingTurnsLeft;
  }

  calculatePlacements() {
    const leader = Math.max(
      this.myPlayer.spacesTravelled,
      this.enemyPlayer1.spacesTravelled,
      this.enemyPlayer2.spacesTravelled
    );

    const middle = Math.max(
      Math.min(
        this.myPlayer.spacesTravelled,
        this.enemyPlayer1.spacesTravelled
      ),
      Math.min(
        this.myPlayer.spacesTravelled,
        this.enemyPlayer2.spacesTravelled
      ),
      Math.min(
        this.enemyPlayer1.spacesTravelled,
        this.enemyPlayer2.spacesTravelled
      )
    );

    const loser = Math.min(
      this.myPlayer.spacesTravelled,
      this.enemyPlayer1.spacesTravelled,
      this.enemyPlayer2.spacesTravelled
    );

    const currentPositions = {
      [myPlayerIdx]: this.myPlayer.spacesTravelled,
      [enemyPlayer1Idx]: this.enemyPlayer1.spacesTravelled,
      [enemyPlayer2Idx]: this.enemyPlayer2.spacesTravelled,
    };

    const getCurrentPlacement = (playerIdx: number) => {
      if (currentPositions[playerIdx] === leader) {
        return 1;
      } else if (currentPositions[playerIdx] === middle) {
        return 2;
      } else if (currentPositions[playerIdx] === loser) {
        return 3;
      } else {
        return 3;
      }
    };

    return {
      [myPlayerIdx]: getCurrentPlacement(myPlayerIdx),
      [enemyPlayer1Idx]: getCurrentPlacement(enemyPlayer1Idx),
      [enemyPlayer2Idx]: getCurrentPlacement(enemyPlayer2Idx),
    };
  }

  convertRiskToMove(risk: string): keyof typeof MOVES | null {
    switch (risk) {
      case "L":
        return MOVES.LEFT;
      case "R":
        return MOVES.RIGHT;
      case "U":
        return MOVES.UP;
      case "D":
        return MOVES.DOWN;
      default:
        return null;
    }
  }

  willWinGame() {
    const totalPossibleSpacesLeft = this.turnsLeftInGame * 3;

    const enemy1TotalPossibleSpacesTravelled =
      this.enemyPlayer1.spacesTravelled + totalPossibleSpacesLeft;

    const enemy2TotalPossibleSpacesTravelled =
      this.enemyPlayer2.spacesTravelled + totalPossibleSpacesLeft;

    return (
      this.myPlayer.spacesTravelled >= enemy1TotalPossibleSpacesTravelled &&
      this.myPlayer.spacesTravelled >= enemy2TotalPossibleSpacesTravelled
    );
  }

  calculateNextMove() {
    if (this.isGameOver || this.willWinGame() || this.myPlayer.isStunned()) {
      return null;
    }

    const moves = {
      [MOVES.RIGHT]: Weight.Best,
      [MOVES.LEFT]: Weight.Best,
      [MOVES.UP]: Weight.Best,
      [MOVES.DOWN]: Weight.Best,
    };

    for (let i = 0; i < this.riskOrder.length; i++) {
      const riskOrderMove = this.riskOrder[i];
      const move = this.convertRiskToMove(riskOrderMove);
      if (!move) {
        continue;
      }
      const moveCost = this.costOfRisk[i];
      const riskSpacesTravelled = this.riskSpacesTravelled[i];
      const finalPosition = this.myPlayer.spacesTravelled + riskSpacesTravelled;
      const totalMoveCost = this.myPlayer.riskOrStunTimer + moveCost;
      if (totalMoveCost >= this.MAX_RISK_ALLOWED && this.skatingTurnsLeft > 1) {
        moves[move] = Weight.getStunnedWeight(this.STUN_TIMER);
      } else if (
        this.enemyPlayer1.isStunned() &&
        finalPosition % 10 === this.enemyPlayer1.spacesTravelled % 10
      ) {
        moves[move] = Weight.getStunnedWeight(this.STUN_TIMER);
      } else if (
        this.enemyPlayer2.isStunned() &&
        finalPosition % 10 === this.enemyPlayer2.spacesTravelled % 10
      ) {
        moves[move] = Weight.getStunnedWeight(this.STUN_TIMER);
      } else {
        moves[move] = totalMoveCost - riskSpacesTravelled;
      }
    }

    // console.error(`My position: ${this.myPlayer.spacesTravelled}`);
    // console.error(`My risk: ${this.myPlayer.riskOrStunTimer}`);
    // console.error(`Moves: ${JSON.stringify(moves)}`);

    return moves;
  }
}

type DivingGameStateArgs = GameStateArgs & {
  divingGoal: string;
  player1Points: number;
  player2Points: number;
  player3Points: number;
  player1Combo: number;
  player2Combo: number;
  player3Combo: number;
};

class DivingActor {
  points: number;
  combo: number;
  constructor(points: number, combo: number) {
    this.points = points;
    this.combo = combo;
  }
}

class DivingGameState extends GameState {
  divingGoal: string;
  myPlayer: DivingActor;
  enemyPlayer1: DivingActor;
  enemyPlayer2: DivingActor;

  constructor(gameState: DivingGameStateArgs) {
    super(gameState.gpu, gameState.turn);

    const allPlayerPoints = [
      gameState.player1Points,
      gameState.player2Points,
      gameState.player3Points,
    ];
    const allCombos = [
      gameState.player1Combo,
      gameState.player2Combo,
      gameState.player3Combo,
    ];
    const myPlayerPoints = allPlayerPoints[myPlayerIdx];
    const myPlayerCombo = allCombos[myPlayerIdx];
    const enemyPlayer1Points = allPlayerPoints[enemyPlayer1Idx];
    const enemyPlayer1Combo = allCombos[enemyPlayer1Idx];
    const enemyPlayer2Points = allPlayerPoints[enemyPlayer2Idx];
    const enemyPlayer2Combo = allCombos[enemyPlayer2Idx];

    this.myPlayer = new DivingActor(myPlayerPoints, myPlayerCombo);
    this.enemyPlayer1 = new DivingActor(enemyPlayer1Points, enemyPlayer1Combo);
    this.enemyPlayer2 = new DivingActor(enemyPlayer2Points, enemyPlayer2Combo);

    this.divingGoal = gameState.divingGoal;
  }

  get turnsLeftInGame(): number {
    return this.divingGoal.length;
  }

  hasGoldMedal(): boolean {
    return scoreKeeper.myPlayerScore.divingMedals.gold > 0;
  }

  hasSilverMedal(): boolean {
    return scoreKeeper.myPlayerScore.divingMedals.silver > 0;
  }

  canFinishGame(): boolean {
    return this.turnsLeft >= this.divingGoal.length;
  }

  calculatePlacements() {
    const leader = Math.max(
      this.myPlayer.points,
      this.enemyPlayer1.points,
      this.enemyPlayer2.points
    );

    const middle = Math.max(
      Math.min(this.myPlayer.points, this.enemyPlayer1.points),
      Math.min(this.myPlayer.points, this.enemyPlayer2.points),
      Math.min(this.enemyPlayer1.points, this.enemyPlayer2.points)
    );

    const loser = Math.min(
      this.myPlayer.points,
      this.enemyPlayer1.points,
      this.enemyPlayer2.points
    );

    const currentPositions = {
      [myPlayerIdx]: this.myPlayer.points,
      [enemyPlayer1Idx]: this.enemyPlayer1.points,
      [enemyPlayer2Idx]: this.enemyPlayer2.points,
    };

    const getCurrentPlacement = (playerIdx: number) => {
      if (currentPositions[playerIdx] === leader) {
        return 1;
      } else if (currentPositions[playerIdx] === middle) {
        return 2;
      } else if (currentPositions[playerIdx] === loser) {
        return 3;
      } else {
        return 3;
      }
    };

    return {
      [myPlayerIdx]: getCurrentPlacement(myPlayerIdx),
      [enemyPlayer1Idx]: getCurrentPlacement(enemyPlayer1Idx),
      [enemyPlayer2Idx]: getCurrentPlacement(enemyPlayer2Idx),
    };
  }

  getForecastedPlacement({
    myForecastedScore,
    enemyPlayer1ForecastedScore,
    enemyPlayer2ForecastedScore,
  }: {
    myForecastedScore: number;
    enemyPlayer1ForecastedScore: number;
    enemyPlayer2ForecastedScore: number;
  }) {
    if (
      myForecastedScore >= enemyPlayer1ForecastedScore &&
      myForecastedScore >= enemyPlayer2ForecastedScore
    ) {
      return -3;
    } else if (
      myForecastedScore >= enemyPlayer1ForecastedScore ||
      myForecastedScore >= enemyPlayer2ForecastedScore
    ) {
      return 0;
    } else {
      return 3;
    }
  }

  getPossiblePointsLeft(movesLeft: number, currentCombo: number) {
    let possiblePoints = 0;
    let currentCom = currentCombo + 1;
    while (movesLeft > 0) {
      possiblePoints += currentCom;
      currentCom++;
      movesLeft--;
    }
    return possiblePoints;
  }

  calculateCorrectMove() {
    const myFinalScore =
      this.myPlayer.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame, this.myPlayer.combo);
    const enemyPlayer1FinalScore =
      this.enemyPlayer1.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame, this.enemyPlayer1.combo);
    const enemyPlayer2FinalScore =
      this.enemyPlayer2.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame, this.enemyPlayer2.combo);

    return this.getForecastedPlacement({
      myForecastedScore: myFinalScore,
      enemyPlayer1ForecastedScore: enemyPlayer1FinalScore,
      enemyPlayer2ForecastedScore: enemyPlayer2FinalScore,
    });
  }

  calculateIncorrectMove() {
    const myFinalScore =
      this.myPlayer.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame - 1, 0);
    const enemyPlayer1FinalScore =
      this.enemyPlayer1.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame, this.enemyPlayer1.combo);
    const enemyPlayer2FinalScore =
      this.enemyPlayer2.points +
      this.getPossiblePointsLeft(this.turnsLeftInGame, this.enemyPlayer2.combo);

    return this.getForecastedPlacement({
      myForecastedScore: myFinalScore,
      enemyPlayer1ForecastedScore: enemyPlayer1FinalScore,
      enemyPlayer2ForecastedScore: enemyPlayer2FinalScore,
    });
  }

  calculateNextMove() {
    if (this.isGameOver) {
      return null;
    }
    const correctMoveWeight = this.calculateCorrectMove();
    const incorrectMoveWeight = this.calculateIncorrectMove();
    const move = this.divingGoal[0];
    switch (move) {
      case "U":
        return {
          [MOVES.RIGHT]: incorrectMoveWeight,
          [MOVES.LEFT]: incorrectMoveWeight,
          [MOVES.UP]: correctMoveWeight,
          [MOVES.DOWN]: incorrectMoveWeight,
        };
      case "D":
        return {
          [MOVES.RIGHT]: incorrectMoveWeight,
          [MOVES.LEFT]: incorrectMoveWeight,
          [MOVES.UP]: incorrectMoveWeight,
          [MOVES.DOWN]: correctMoveWeight,
        };
      case "L":
        return {
          [MOVES.RIGHT]: incorrectMoveWeight,
          [MOVES.LEFT]: correctMoveWeight,
          [MOVES.UP]: incorrectMoveWeight,
          [MOVES.DOWN]: incorrectMoveWeight,
        };
      case "R":
        return {
          [MOVES.RIGHT]: correctMoveWeight,
          [MOVES.LEFT]: incorrectMoveWeight,
          [MOVES.UP]: incorrectMoveWeight,
          [MOVES.DOWN]: incorrectMoveWeight,
        };
      default:
        return null;
    }
  }
}

class DecisionMaker {
  gameStates: HurdleGameState[];
  constructor(gameStates: HurdleGameState[]) {
    this.gameStates = gameStates;
  }

  prioritizeGames(): HurdleGameState[] {
    return this.gameStates.sort((a, b) => {
      return a.myPlayer.position - b.myPlayer.position;
    });
  }
}

function decideMove(gameStates: GameState[] | null) {
  const allGames = gameStates?.filter(
    (gameState) => !gameState.isGameOver || gameState.canFinishGame()
  );
  if (!allGames || allGames.length === 0) {
    return MOVES.LEFT;
  }

  //  const priorityGames = allGames.filter((game) => !game.hasGoldMedal());
  // const priorityGames = allGames.filter(
  //   (game) => game instanceof HurdleGameState
  // );
  // const games = priorityGames.length > 0 ? priorityGames : allGames;
  const games = allGames;

  const movesToDecideFrom: {
    readonly LEFT: number;
    readonly DOWN: number;
    readonly RIGHT: number;
    readonly UP: number;
  }[] = [];
  for (const game of games) {
    const moves = game.calculateNextMove();
    if (moves) {
      const typeOfGame =
        game instanceof HurdleGameState
          ? "Hurdle"
          : game instanceof ArcheryGameState
          ? "Archery"
          : game instanceof RollerSkateGameState
          ? "RollerSkate"
          : "Diving";
      console.error(`moves [${typeOfGame}]: ${JSON.stringify(moves)}`);
      const weightedMoves = Weight.weightMoves({
        moves,
        turnsLeft: game.turnsLeftInGame,
        currentPlacement: game.myCurrentPlacement,
        hasGoldMedal: game.hasGoldMedal(),
        hasSilverMedal: game.hasSilverMedal(),
      });
      movesToDecideFrom.push(weightedMoves);
    }
  }

  const leftPoints = movesToDecideFrom.reduce(
    (acc, move) => acc + move[MOVES.LEFT],
    0
  );

  const rightPoints = movesToDecideFrom.reduce(
    (acc, move) => acc + move[MOVES.RIGHT],
    0
  );

  const upPoints = movesToDecideFrom.reduce(
    (acc, move) => acc + move[MOVES.UP],
    0
  );

  const downPoints = movesToDecideFrom.reduce(
    (acc, move) => acc + move[MOVES.DOWN],
    0
  );

  const allPoints = [
    { move: MOVES.LEFT, points: leftPoints },
    { move: MOVES.RIGHT, points: rightPoints },
    { move: MOVES.UP, points: upPoints },
    { move: MOVES.DOWN, points: downPoints },
  ];

  const sortedPoints = allPoints.sort((a, b) => a.points - b.points);

  console.error(`sortedPoints: ${JSON.stringify(sortedPoints)}`);
  return sortedPoints.length > 0 ? sortedPoints[0].move : MOVES.LEFT;
}

// game loop
while (true) {
  let gameStates: GameState[] = [];
  let moves: string[][] = [];
  for (let i = 0; i < 3; i++) {
    const scoreInfo: string = readline();
    // console.error(`scoreInfo: ${scoreInfo}`);
  }
  for (let i = 0; i < nbGames; i++) {
    var inputs: string[] = readline().split(" ");
    const gpu: string = inputs[0];
    const reg0: number = parseInt(inputs[1]);
    const reg1: number = parseInt(inputs[2]);
    const reg2: number = parseInt(inputs[3]);
    const reg3: number = parseInt(inputs[4]);
    const reg4: number = parseInt(inputs[5]);
    const reg5: number = parseInt(inputs[6]);
    const reg6: number = parseInt(inputs[7]);

    switch (i) {
      case 0:
        const hurdleGameState = new HurdleGameState({
          gpu,
          turn,
          map: gpu,
          position1: reg0,
          position2: reg1,
          position3: reg2,
          stunTimer1: reg3,
          stunTimer2: reg4,
          stunTimer3: reg5,
        });
        gameStates.push(hurdleGameState);
        scoreKeeper.updateHurdleScores(hurdleGameState);

        break;
      case 1:
        const archeryGameState = new ArcheryGameState({
          gpu,
          turn,
          windPower: gpu,
          player1X: reg0,
          player1Y: reg1,
          player2X: reg2,
          player2Y: reg3,
          player3X: reg4,
          player3Y: reg5,
        });
        gameStates.push(archeryGameState);
        scoreKeeper.updateArcheryScores(archeryGameState);
        break;
      case 2:
        const rollerSkateGameState = new RollerSkateGameState({
          gpu,
          turn,
          skatingTurnsLeft: reg6,
          riskOrder: gpu,
          player1SpacesTravelled: reg0,
          player2SpacesTravelled: reg1,
          player3SpacesTravelled: reg2,
          player1RiskOrStunTimer: reg3,
          player2RiskOrStunTimer: reg4,
          player3RiskOrStunTimer: reg5,
        });
        gameStates.push(rollerSkateGameState);
        scoreKeeper.updateRollerSkateScores(rollerSkateGameState);
        break;
      case 3:
        const divingGameState = new DivingGameState({
          gpu,
          turn,
          divingGoal: gpu,
          player1Points: reg0,
          player2Points: reg1,
          player3Points: reg2,
          player1Combo: reg3,
          player2Combo: reg4,
          player3Combo: reg5,
        });
        gameStates.push(divingGameState);
        scoreKeeper.updateDivingScores(divingGameState);
        break;
    }
  }

  const move = decideMove(gameStates);
  console.log(move);
  turn++;
}
