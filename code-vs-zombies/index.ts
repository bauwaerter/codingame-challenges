const HERO_RADIUS = 2000;
const HERO_SPEED = 1000;
const ZOMBIE_SPEED = 400;

interface Point {
  x: number;
  y: number;
}

interface HumanEntity extends Point {
  id: number;
}

interface ZombieEntity extends HumanEntity {
  nextX: number;
  nextY: number;
}

interface DecisionTreeNode<T> {
  condition?: (input: T) => boolean;
  yes?: DecisionTreeNode<T>;
  no?: DecisionTreeNode<T>;
  action?: (input: T) => Point;
}

function isWithinHeroRadius(
  hero: Point,
  human: Point,
  radius: number
): boolean {
  const distanceToHuman = calculateDistance(hero, human);
  return distanceToHuman <= radius;
}

function calculateDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateFurthestHuman(
  humans: HumanEntity[],
  center: Point
): HumanEntity {
  let furthest = humans[0];
  let maxDistance = 0;

  humans.forEach((human) => {
    const distance = calculateDistance(human, center);
    if (distance > maxDistance) {
      maxDistance = distance;
      furthest = human;
    }
  });

  return furthest;
}

function calculateCenter(points: Point[]): Point {
  const center = { x: 0, y: 0 };
  points.forEach((point) => {
    center.x += point.x;
    center.y += point.y;
  });
  center.x /= points.length;
  center.y /= points.length;

  return center;
}

interface GameState {
  hero: Point;
  humans: HumanEntity[];
  zombies: ZombieEntity[];
}

function moveToHumanCluster(state: GameState): Point {
  console.error("Moving to human cluster");
  let humans = state.humans;
  let center = calculateCenter(humans);
  let humanDistancesToCenter = humans.map((human) =>
    calculateDistance(human, center)
  );

  while (humanDistancesToCenter.every((distance) => distance > HERO_RADIUS)) {
    const furthestHuman = calculateFurthestHuman(humans, center);
    humans = humans.filter((human) => human.id !== furthestHuman.id);
    center = calculateCenter(humans);
    humanDistancesToCenter = humans.map((human) =>
      calculateDistance(human, center)
    );
  }

  return center;
}

function attackClosestZombie(state: GameState): Point {
  console.error("Attacking closest zombie");
  let target: HumanEntity | null = null;
  let minDistance = Infinity;

  for (const zombie of state.zombies) {
    const distance = calculateDistance(state.hero, zombie);
    if (distance < minDistance) {
      minDistance = distance;
      target = zombie;
    }
  }

  return target ? { x: target.x, y: target.y } : state.hero;
}

function saveHumanInDanger(state: GameState): Point {
  console.error("Human in danger!");
  let targetZombie: ZombieEntity | null = null;
  let minTimeToHuman = Infinity;

  for (const zombie of state.zombies) {
    for (const human of state.humans) {
      const timeToHuman = calculateDistance(zombie, human) / ZOMBIE_SPEED;
      if (timeToHuman < minTimeToHuman) {
        minTimeToHuman = timeToHuman;
        targetZombie = zombie;
      }
    }
  }

  return targetZombie ? { x: targetZombie.x, y: targetZombie.y } : state.hero;
}

const decisionTree: DecisionTreeNode<GameState> = {
  condition: (state) => {
    return state.humans.some((human) => {
      const distanceToHuman = calculateDistance(state.hero, human);
      const heroTime = Math.max(0, distanceToHuman - HERO_RADIUS) / HERO_SPEED;
      return state.zombies.some(
        (zombie) =>
          calculateDistance({ x: zombie.nextX, y: zombie.nextY }, human) /
            ZOMBIE_SPEED <=
          heroTime
      );
    });
  },
  yes: {
    // If a human is in immediate danger, save them
    action: saveHumanInDanger,
  },
  no: {
    condition: (state) => {
      // Check if zombies are close to multiple humans
      return state.humans.length > 1;
    },
    yes: {
      action: moveToHumanCluster,
    },
    no: {
      action: attackClosestZombie,
    },
  },
};

// Decision tree evaluator
function evaluateDecisionTree<T>(node: DecisionTreeNode<T>, input: T): Point {
  if (node.action) {
    return node.action(input);
  }

  if (node.condition && node.yes && node.no) {
    return node.condition(input)
      ? evaluateDecisionTree(node.yes, input)
      : evaluateDecisionTree(node.no, input);
  }

  throw new Error("Invalid decision tree structure");
}

while (true) {
  const inputs: string[] = readline().split(" ");
  const x: number = parseInt(inputs[0]);
  const y: number = parseInt(inputs[1]);
  const hero: Point = { x, y };

  const humanCount = parseInt(readline());
  const humans: HumanEntity[] = [];
  for (let i = 0; i < humanCount; i++) {
    const inputs = readline().split(" ").map(Number);
    humans.push({ id: inputs[0], x: inputs[1], y: inputs[2] });
  }

  const zombieCount = parseInt(readline());
  const zombies: ZombieEntity[] = [];
  for (let i = 0; i < zombieCount; i++) {
    const inputs = readline().split(" ").map(Number);
    zombies.push({
      id: inputs[0],
      x: inputs[1],
      y: inputs[2],
      nextX: inputs[3],
      nextY: inputs[4],
    });
  }
  const HERO_RADIUS = 2000;

  const humansThatCanBeSaved = humans.filter((human) => {
    const distanceToHuman = calculateDistance(hero, human);
    const heroTime = Math.max(0, distanceToHuman - HERO_RADIUS) / HERO_SPEED;

    return zombies.every((zombie) => {
      const distanceToZombie = calculateDistance(human, zombie);
      const zombieTime = distanceToZombie / ZOMBIE_SPEED;
      return heroTime <= zombieTime;
    });
  });

  console.error(`humans that can be saved ${humansThatCanBeSaved.length}`);

  const gameState: GameState = { hero, humans: humansThatCanBeSaved, zombies };
  const nextMove = evaluateDecisionTree(decisionTree, gameState);

  console.log(`${Math.round(nextMove.x)} ${Math.round(nextMove.y)}`);
}
