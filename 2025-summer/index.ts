/**
 * Win the water fight by controlling the most territory, or out-soak your opponent!
 **/
abstract class Action {
  abstract readonly type:
    | "MOVE"
    | "SHOOT"
    | "THROW"
    | "HUNKER_DOWN"
    | "MESSAGE";
  abstract toString(): string;
}

class MoveAction extends Action {
  readonly type = "MOVE" as const;

  constructor(public x: number, public y: number) {
    super();
  }

  toString(): string {
    return `MOVE ${this.x} ${this.y}`;
  }
}

class ShootAction extends Action {
  readonly type = "SHOOT" as const;

  constructor(public targetAgentId: number) {
    super();
  }

  toString(): string {
    return `SHOOT ${this.targetAgentId}`;
  }
}

class ThrowAction extends Action {
  readonly type = "THROW" as const;

  constructor(public x: number, public y: number) {
    super();
  }

  toString(): string {
    return `THROW ${this.x} ${this.y}`;
  }
}

class HunkerDownAction extends Action {
  readonly type = "HUNKER_DOWN" as const;
  toString(): string {
    return "HUNKER_DOWN";
  }
}

class MessageAction extends Action {
  readonly type = "MESSAGE" as const;

  constructor(public text: string) {
    super();
  }

  toString(): string {
    return `MESSAGE ${this.text}`;
  }
}

class Agent {
  constructor(
    public id: number,
    public playerId: number,
    public shootCooldown: number,
    public optimalRange: number,
    public soakingPower: number,
    public splashBombs: number
  ) {}
}

class ActiveAgent extends Agent {
  constructor(
    id: number,
    playerId: number,
    shootCooldown: number,
    optimalRange: number,
    soakingPower: number,
    splashBombs: number,
    public x: number,
    public y: number,
    public cooldown: number,
    public wetness: number
  ) {
    super(id, playerId, shootCooldown, optimalRange, soakingPower, splashBombs);
  }
}

class Tile {
  constructor(
    public x: number,
    public y: number,
    public tileType: number // 0 = empty, 1 = water, 2 = mud, 3 = grass
  ) {}
}

function findNearestHighestCover(
  gameState: GameState,
  agent: ActiveAgent
): Tile | null {
  let nearestCover: Tile | null = null;
  let shortestDistance = Infinity;
  let highestCoverValue = 0;

  for (let y = 0; y < gameState.height; y++) {
    for (let x = 0; x < gameState.width; x++) {
      const tile = gameState.tiles[y][x];
      if (tile.tileType > 0) {
        // 1 or 2 (cover tiles)
        const distance = manhattanDistance(agent, tile);

        // Prioritize higher cover, then closer distance
        if (
          tile.tileType > highestCoverValue ||
          (tile.tileType === highestCoverValue && distance < shortestDistance)
        ) {
          nearestCover = tile;
          shortestDistance = distance;
          highestCoverValue = tile.tileType;
        }
      }
    }
  }

  return nearestCover;
}

function needsCover(gameState: GameState, agent: ActiveAgent): boolean {
  const enemies = gameState.getEnemyAgents();

  // Check if any enemy can shoot us
  for (const enemy of enemies) {
    if (
      enemy.cooldown === 0 &&
      manhattanDistance(agent, enemy) <= enemy.optimalRange
    ) {
      return true;
    }
  }

  return false;
}

function calculateEffectiveDamage(
  gameState: GameState,
  shooter: ActiveAgent,
  target: ActiveAgent
): number {
  let baseDamage = shooter.soakingPower;

  try {
    const coverReduction = getCoverProtection(gameState, shooter, target);
    const effectiveDamage = Math.floor(baseDamage * (1 - coverReduction));
    console.error(
      `Target ${target.id}: base=${baseDamage}, reduction=${coverReduction}, effective=${effectiveDamage}`
    );
    return effectiveDamage;
  } catch (error) {
    console.error(`Error calculating damage for target ${target.id}: ${error}`);
    return baseDamage; // Fallback to no cover
  }
}

function getCoverProtection(
  gameState: GameState,
  shooter: ActiveAgent,
  target: ActiveAgent
): number {
  // Find adjacent cover tiles to target
  const adjacentPositions = [
    { x: target.x + 1, y: target.y },
    { x: target.x - 1, y: target.y },
    { x: target.x, y: target.y + 1 },
    { x: target.x, y: target.y - 1 },
  ];

  let maxCoverValue = 0;

  for (const pos of adjacentPositions) {
    if (
      pos.x >= 0 &&
      pos.x < gameState.width &&
      pos.y >= 0 &&
      pos.y < gameState.height
    ) {
      const tile = gameState.tiles[pos.y][pos.x];
      if (tile.tileType > 0) {
        // Cover tile
        // Check if shooter is on opposite side of cover
        if (isOppositePosition(shooter, target, pos)) {
          maxCoverValue = Math.max(maxCoverValue, tile.tileType);
        }
      }
    }
  }

  // Convert cover value to damage reduction
  return maxCoverValue === 1 ? 0.5 : maxCoverValue === 2 ? 0.75 : 0;
}

function isOppositePosition(
  shooter: ActiveAgent,
  target: ActiveAgent,
  coverPos: Point
): boolean {
  // Check if shooter and target are on opposite sides of cover tile
  const shooterToCover = {
    x: coverPos.x - shooter.x,
    y: coverPos.y - shooter.y,
  };
  const targetToCover = { x: coverPos.x - target.x, y: coverPos.y - target.y };

  // If signs are opposite, they're on opposite sides
  return (
    shooterToCover.x * targetToCover.x < 0 ||
    shooterToCover.y * targetToCover.y < 0
  );
}

function findOptimalThrowPosition(
  gameState: GameState,
  currentAgent: ActiveAgent
): Point | null {
  const myAgents = gameState.getMyAgents();
  const enemyAgents = gameState.getEnemyAgents();

  console.error(
    `Agent ${currentAgent.id}: checking throw positions, has ${currentAgent.splashBombs} bombs`
  );

  if (enemyAgents.length === 0 || currentAgent.splashBombs === 0) {
    console.error(
      `No throw: enemies=${enemyAgents.length}, bombs=${currentAgent.splashBombs}`
    );
    return null;
  }

  let bestPosition: Point | null = null;
  let maxEnemyHits = 0;
  let positionsChecked = 0;

  // Check all positions within throw range (4 tiles)
  for (let dx = -4; dx <= 4; dx++) {
    for (let dy = -4; dy <= 4; dy++) {
      const throwX = currentAgent.x + dx;
      const throwY = currentAgent.y + dy;

      // Check if within map bounds and throw range
      if (
        throwX < 0 ||
        throwX >= gameState.width ||
        throwY < 0 ||
        throwY >= gameState.height ||
        manhattanDistance(currentAgent, { x: throwX, y: throwY }) > 4
      ) {
        continue;
      }

      positionsChecked++;

      // Get splash area (target + 8 adjacent tiles)
      const splashArea = getSplashArea(throwX, throwY);

      let enemyHits = 0;
      let friendlyHits = 0;

      // Count enemies in splash area
      for (const enemy of enemyAgents) {
        if (splashArea.some((pos) => pos.x === enemy.x && pos.y === enemy.y)) {
          enemyHits++;
        }
      }

      // Count friendlies in splash area (excluding current agent)
      for (const friendly of myAgents) {
        if (
          friendly.id !== currentAgent.id &&
          splashArea.some((pos) => pos.x === friendly.x && pos.y === friendly.y)
        ) {
          friendlyHits++;
        }
      }

      console.error(
        `Position (${throwX},${throwY}): enemies=${enemyHits}, friendlies=${friendlyHits}`
      );

      // Only consider positions with no friendly fire
      if (friendlyHits === 0 && enemyHits > maxEnemyHits) {
        maxEnemyHits = enemyHits;
        bestPosition = { x: throwX, y: throwY };
        console.error(
          `New best position: (${throwX},${throwY}) with ${enemyHits} enemy hits`
        );
      }
    }
  }

  console.error(
    `Checked ${positionsChecked} positions, best: ${
      bestPosition ? `(${bestPosition.x},${bestPosition.y})` : "none"
    } with ${maxEnemyHits} hits`
  );
  return bestPosition;
}

function findClosestValidMovePosition(
  gameState: GameState,
  currentAgent: ActiveAgent,
  throwX: number,
  throwY: number
): Point | null {
  // Find positions within throw range (4) of the target throw position
  for (let distance = 1; distance <= 4; distance++) {
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        if (Math.abs(dx) + Math.abs(dy) !== distance) continue; // Only check positions at exact distance

        const moveX = throwX + dx;
        const moveY = throwY + dy;

        if (
          moveX < 0 ||
          moveX >= gameState.width ||
          moveY < 0 ||
          moveY >= gameState.height
        )
          continue;

        const moveTile = gameState.tiles[moveY][moveX];
        if (moveTile.tileType > 0) continue; // Skip impassable tiles

        return { x: moveX, y: moveY };
      }
    }
  }

  return null;
}

function findOptimalThrowMovePosition(
  gameState: GameState,
  currentAgent: ActiveAgent
): { movePosition: Point; throwPosition: Point } | null {
  if (currentAgent.splashBombs === 0) return null;

  const enemyAgents = gameState.getEnemyAgents();
  const myAgents = gameState.getMyAgents();

  let bestResult: { movePosition: Point; throwPosition: Point } | null = null;
  let maxEnemyHits = 0;

  // For each enemy, consider throw positions that would hit them
  for (const enemy of enemyAgents) {
    // Check 9 possible throw positions (enemy position + 8 adjacent)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const throwX = enemy.x + dx;
        const throwY = enemy.y + dy;

        // Check bounds
        if (
          throwX < 0 ||
          throwX >= gameState.width ||
          throwY < 0 ||
          throwY >= gameState.height
        )
          continue;

        // Count total enemies hit by this throw
        const splashArea = getSplashArea(throwX, throwY);
        let enemyHits = 0;
        let friendlyHits = 0;

        for (const e of enemyAgents) {
          if (splashArea.some((pos) => pos.x === e.x && pos.y === e.y)) {
            enemyHits++;
          }
        }

        for (const friendly of myAgents) {
          if (
            friendly.id !== currentAgent.id &&
            splashArea.some(
              (pos) => pos.x === friendly.x && pos.y === friendly.y
            )
          ) {
            friendlyHits++;
          }
        }

        // Skip if friendly fire or not better than current best
        if (friendlyHits > 0 || enemyHits <= maxEnemyHits) continue;

        // Find closest valid move position to reach this throw
        const movePosition = findClosestValidMovePosition(
          gameState,
          currentAgent,
          throwX,
          throwY
        );
        if (movePosition) {
          maxEnemyHits = enemyHits;
          bestResult = {
            movePosition,
            throwPosition: { x: throwX, y: throwY },
          };
        }
      }
    }
  }

  return bestResult;
}
function getSplashArea(x: number, y: number): Point[] {
  const area: Point[] = [{ x, y }]; // Center tile

  // Add 8 adjacent tiles (orthogonal + diagonal)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx !== 0 || dy !== 0) {
        // Skip center tile
        area.push({ x: x + dx, y: y + dy });
      }
    }
  }

  return area;
}

function findClosestHighWetnessEnemy(
  gameState: GameState,
  currentAgent: ActiveAgent
): ActiveAgent | null {
  const enemyAgents = gameState.getEnemyAgents();

  if (enemyAgents.length === 0) return null;

  // Filter to only enemies in shooting range
  const enemiesInRange = enemyAgents.filter((enemy) =>
    GameUtils.combat.isInShootingRange(currentAgent, enemy)
  );

  console.error(
    `Enemies in range: ${enemiesInRange.length} out of ${enemyAgents.length}`
  );

  if (enemiesInRange.length === 0) return null;

  // Sort by wetness (descending), then by effective damage (descending), then by distance (ascending)
  const sortedEnemies = enemiesInRange.sort((a, b) => {
    const wetnessA = a.wetness;
    const wetnessB = b.wetness;
    console.error(
      `Comparing ${a.id} vs ${b.id}: wetness ${wetnessA} vs ${wetnessB}`
    );

    if (wetnessA !== wetnessB) {
      return wetnessB - wetnessA;
    }

    const effectiveDamageA = calculateEffectiveDamage(
      gameState,
      currentAgent,
      a
    );
    const effectiveDamageB = calculateEffectiveDamage(
      gameState,
      currentAgent,
      b
    );
    console.error(
      `Effective damage: ${a.id}=${effectiveDamageA}, ${b.id}=${effectiveDamageB}`
    );

    if (effectiveDamageA !== effectiveDamageB) {
      return effectiveDamageB - effectiveDamageA;
    }

    const coverA = getCoverProtection(gameState, currentAgent, a);
    const coverB = getCoverProtection(gameState, currentAgent, b);
    console.error(`Cover: ${a.id}=${coverA}, ${b.id}=${coverB}`);

    if (coverA !== coverB) {
      return coverA - coverB;
    }

    const distanceA = manhattanDistance(currentAgent, a);
    const distanceB = manhattanDistance(currentAgent, b);
    console.error(`Distance: ${a.id}=${distanceA}, ${b.id}=${distanceB}`);
    return distanceA - distanceB;
  });

  console.error(`Final choice: ${sortedEnemies[0].id}`);

  return sortedEnemies[0];
}

function findFarthestEnemy(
  gameState: GameState,
  currentAgent: ActiveAgent
): ActiveAgent | null {
  const enemyAgents = gameState.getEnemyAgents();

  if (enemyAgents.length === 0) return null;

  let farthestEnemy: ActiveAgent | null = null;
  let maxDistance = 0;

  for (const enemy of enemyAgents) {
    const distance = manhattanDistance(currentAgent, enemy);
    if (distance > maxDistance) {
      maxDistance = distance;
      farthestEnemy = enemy;
    }
  }

  return farthestEnemy;
}

function isInShootingRange(
  currentAgent: ActiveAgent,
  target: ActiveAgent
): boolean {
  const distance = manhattanDistance(currentAgent, target);
  return distance <= currentAgent.optimalRange && currentAgent.cooldown === 0;
}

function shootClosestHighWetnessEnemy(
  state: GameState,
  currentAgent: ActiveAgent
): Action {
  const closestEnemy = GameUtils.positioning.findClosestHighWetnessEnemy(
    state,
    currentAgent
  );
  if (closestEnemy) {
    return new ShootAction(closestEnemy.id);
  }
  return new HunkerDownAction(); // Fallback if no enemy found
}

function isValidMovePosition(
  gameState: GameState,
  x: number,
  y: number
): boolean {
  // Check bounds
  if (x < 0 || x >= gameState.width || y < 0 || y >= gameState.height) {
    return false;
  }

  // Check if tile is passable (cover tiles are impassable)
  const tile = gameState.tiles[y][x];
  return tile.tileType === 0; // Only empty tiles are passable
}

function findValidMoveToward(
  gameState: GameState,
  currentAgent: ActiveAgent,
  targetX: number,
  targetY: number
): Point | null {
  // Try to move one step closer to target
  const dx = targetX - currentAgent.x;
  const dy = targetY - currentAgent.y;

  // Normalize to single step
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  // Try preferred direction first
  const preferredX = currentAgent.x + stepX;
  const preferredY = currentAgent.y + stepY;

  if (isValidMovePosition(gameState, preferredX, preferredY)) {
    return { x: preferredX, y: preferredY };
  }

  // Try X direction only
  if (
    stepX !== 0 &&
    isValidMovePosition(gameState, currentAgent.x + stepX, currentAgent.y)
  ) {
    return { x: currentAgent.x + stepX, y: currentAgent.y };
  }

  // Try Y direction only
  if (
    stepY !== 0 &&
    isValidMovePosition(gameState, currentAgent.x, currentAgent.y + stepY)
  ) {
    return { x: currentAgent.x, y: currentAgent.y + stepY };
  }

  return null; // No valid move found
}

const GameUtils = {
  combat: {
    shootClosestHighWetnessEnemy,
    needsCover,
    isInShootingRange,
  },
  positioning: {
    findNearestHighestCover,
    findClosestHighWetnessEnemy,
    manhattanDistance,
  },
};

class GameState {
  public myId: number = 0;
  public agents: Agent[] = [];
  public activeAgents: ActiveAgent[] = [];
  public tiles: Tile[][] = [];
  public width: number = 0;
  public height: number = 0;

  setMyId(id: number) {
    this.myId = id;
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addAgent(agent: Agent) {
    this.agents.push(agent);
  }

  addActiveAgent(agent: ActiveAgent) {
    this.activeAgents.push(agent);
  }

  getAgentById(agentId: number): Agent | undefined {
    return this.agents.find((agent) => agent.id === agentId);
  }

  addTile(tile: Tile) {
    if (!this.tiles[tile.y]) {
      this.tiles[tile.y] = [];
    }
    this.tiles[tile.y][tile.x] = tile;
  }

  getMyAgents(): ActiveAgent[] {
    return this.activeAgents.filter((agent) => agent.playerId === this.myId);
  }

  getEnemyAgents(): ActiveAgent[] {
    return this.activeAgents.filter((agent) => agent.playerId !== this.myId);
  }

  reset() {
    this.activeAgents = [];
  }
}

interface Point {
  x: number;
  y: number;
}

function manhattanDistance(p1: Point, p2: Point): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

interface DecisionTreeNode<T> {
  condition?: (input: T, currentAgent: ActiveAgent) => boolean;
  yes?: DecisionTreeNode<T>;
  no?: DecisionTreeNode<T>;
  action?: (input: T, currentAgent: ActiveAgent) => Action;
}

const decisionTree: DecisionTreeNode<GameState> = {
  condition: (state, currentAgent) => {
    const closestEnemy = GameUtils.positioning.findClosestHighWetnessEnemy(
      state,
      currentAgent
    );
    if (closestEnemy) {
      // Check if the closest enemy is within shooting range
      return GameUtils.combat.isInShootingRange(currentAgent, closestEnemy);
    } else {
      // If no enemies are found, we can assume no immediate danger
      return false;
    }
  },
  yes: {
    // If a human is in immediate danger, save them
    action: shootClosestHighWetnessEnemy,
  },
  no: {
    action: () => {
      return new HunkerDownAction();
    },
  },
  // no: {
  //   condition: (state) => {
  //     // Check if zombies are close to multiple humans
  //     return state.humans.length > 1;
  //   },
  //   yes: {
  //     action: moveToHumanCluster,
  //   },
  //   no: {
  //     action: attackClosestZombie,
  //   },
  // },
};

function buildActionSequence(
  gameState: GameState,
  currentAgent: ActiveAgent
): Action[] {
  const actions: Action[] = [];

  // Branch 1: Check for optimal move + throw combination
  if (currentAgent.splashBombs > 0) {
    const optimalThrow = findOptimalThrowMovePosition(gameState, currentAgent);
    if (
      optimalThrow &&
      isValidMovePosition(
        gameState,
        optimalThrow.movePosition.x,
        optimalThrow.movePosition.y
      )
    ) {
      // Move to optimal throw position, then throw
      actions.push(
        new MoveAction(optimalThrow.movePosition.x, optimalThrow.movePosition.y)
      );
      actions.push(
        new ThrowAction(
          optimalThrow.throwPosition.x,
          optimalThrow.throwPosition.y
        )
      );
      console.error(
        `Agent ${currentAgent.id} moving to (${optimalThrow.movePosition.x},${optimalThrow.movePosition.y}) then throwing at (${optimalThrow.throwPosition.x},${optimalThrow.throwPosition.y})`
      );
      return actions;
    }
  }

  // Branch 2: Combat branch - move for cover/positioning, then shoot

  // Check if we need cover first
  if (GameUtils.combat.needsCover(gameState, currentAgent)) {
    const coverTile = GameUtils.positioning.findNearestHighestCover(
      gameState,
      currentAgent
    );
    if (coverTile && isValidMovePosition(gameState, coverTile.x, coverTile.y)) {
      actions.push(new MoveAction(coverTile.x, coverTile.y));
      // Update agent position for subsequent calculations
      currentAgent.x = coverTile.x;
      currentAgent.y = coverTile.y;
    }
  }

  // Check if we can shoot an enemy
  const closestEnemy = GameUtils.positioning.findClosestHighWetnessEnemy(
    gameState,
    currentAgent
  );
  if (
    closestEnemy &&
    GameUtils.combat.isInShootingRange(currentAgent, closestEnemy)
  ) {
    actions.push(new ShootAction(closestEnemy.id));
    console.error(
      `Agent ${currentAgent.id} shooting at enemy ${closestEnemy.id}`
    );
  }

  // If no combat actions, move toward farthest enemy
  if (actions.length === 0) {
    const farthestEnemy = findFarthestEnemy(gameState, currentAgent);
    if (farthestEnemy) {
      const validMove = findValidMoveToward(
        gameState,
        currentAgent,
        farthestEnemy.x,
        farthestEnemy.y
      );
      if (validMove) {
        actions.push(new MoveAction(validMove.x, validMove.y));
        console.error(
          `Agent ${currentAgent.id} moving toward farthest enemy ${farthestEnemy.id}`
        );
      } else {
        actions.push(new HunkerDownAction());
        console.error(
          `Agent ${currentAgent.id} hunkering down - no valid move found`
        );
      }
    } else {
      actions.push(new HunkerDownAction());
      console.error(
        `Agent ${currentAgent.id} hunkering down - no enemies found`
      );
    }
  }

  return actions;
}
function evaluateDecisionTree<T>(
  node: DecisionTreeNode<T>,
  input: T,
  currentAgent: ActiveAgent
): Action[] {
  const actions: Action[] = [];
  if (node.action) {
    return [node.action(input, currentAgent)];
  }

  if (node.condition && node.yes && node.no) {
    return node.condition(input, currentAgent)
      ? evaluateDecisionTree(node.yes, input, currentAgent)
      : evaluateDecisionTree(node.no, input, currentAgent);
  }

  throw new Error("Invalid decision tree structure");
}

const gameState = new GameState();

const myId: number = parseInt(readline()); // Your player id (0 or 1)
gameState.setMyId(myId);

const agentDataCount: number = parseInt(readline()); // Total number of agents in the game
for (let i = 0; i < agentDataCount; i++) {
  var inputs: string[] = readline().split(" ");
  const agentId: number = parseInt(inputs[0]); // Unique identifier for this agent
  const player: number = parseInt(inputs[1]); // Player id of this agent
  const shootCooldown: number = parseInt(inputs[2]); // Number of turns between each of this agent's shots
  const optimalRange: number = parseInt(inputs[3]); // Maximum manhattan distance for greatest damage output
  const soakingPower: number = parseInt(inputs[4]); // Damage output within optimal conditions
  const splashBombs: number = parseInt(inputs[5]); // Number of splash bombs this can throw this game

  const agent = new Agent(
    agentId,
    player,
    shootCooldown,
    optimalRange,
    soakingPower,
    splashBombs
  );
  gameState.addAgent(agent);
}
var inputs: string[] = readline().split(" ");
const width: number = parseInt(inputs[0]); // Width of the game map
const height: number = parseInt(inputs[1]); // Height of the game map

gameState.setDimensions(width, height);
for (let i = 0; i < height; i++) {
  var inputs: string[] = readline().split(" ");
  for (let j = 0; j < width; j++) {
    const x: number = parseInt(inputs[3 * j]); // X coordinate, 0 is left edge
    const y: number = parseInt(inputs[3 * j + 1]); // Y coordinate, 0 is top edge
    const tileType: number = parseInt(inputs[3 * j + 2]);
    const tile = new Tile(x, y, tileType);
    gameState.addTile(tile);
  }
}

// game loop
while (true) {
  const agentCount: number = parseInt(readline()); // Total number of agents still in the game
  for (let i = 0; i < agentCount; i++) {
    var inputs: string[] = readline().split(" ");
    const agentId: number = parseInt(inputs[0]);
    const x: number = parseInt(inputs[1]);
    const y: number = parseInt(inputs[2]);
    const cooldown: number = parseInt(inputs[3]); // Number of turns before this agent can shoot
    const splashBombs: number = parseInt(inputs[4]);
    const wetness: number = parseInt(inputs[5]); // Damage (0-100) this agent has taken
    const agent: Agent | undefined = gameState.getAgentById(agentId);
    if (!agent) {
      console.error(`Agent with ID ${agentId} not found in game state.`);
      continue;
    }
    const activeAgent = new ActiveAgent(
      agentId,
      agent.playerId,
      agent.shootCooldown,
      agent.optimalRange,
      agent.soakingPower,
      splashBombs,
      x,
      y,
      cooldown,
      wetness
    );
    gameState.addActiveAgent(activeAgent);
  }
  const myAgentCount: number = parseInt(readline()); // Number of alive agents controlled by you
  const myAgents = gameState.getMyAgents();
  for (let i = 0; i < myAgentCount; i++) {
    // Write an action using console.log()
    // To debug: console.error('Debug messages...');

    // One line per agent: <agentId>;<action1;action2;...> actions are "MOVE x y | SHOOT id | THROW x y | HUNKER_DOWN | MESSAGE text"
    const currentAgent = myAgents[i];
    if (!currentAgent) {
      console.error(`My agent with index ${i} not found.`);
      continue;
    }
    const start = performance.now();
    const nextActions = buildActionSequence(gameState, currentAgent);
    const actions = nextActions.map((a) => a.toString()).join(";");
    const end = performance.now();
    const diff = `${(end - start).toFixed(2)}ms`;

    const messageAction = new MessageAction(diff);

    console.log(`${myAgents[i].id};${actions};${messageAction}`);
  }

  gameState.reset();
}
