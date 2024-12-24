/**
 * Grow and multiply your organisms to end up larger than your opponent.
 **/

function calculateDistance(a: Cell, b: Cell): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

abstract class Action {
  abstract type: "WAIT" | "GROW";
  abstract toString(): string;
}

class WaitAction extends Action {
  public readonly type = "WAIT";

  toString(): string {
    return this.type;
  }
}

class GrowAction extends Action {
  public readonly type = "GROW";
  public readonly organId: number;
  public readonly x: number;
  public readonly y: number;
  public readonly organType: CellType;
  public readonly direction: OrganDirection;

  constructor({
    organId,
    x,
    y,
    organType,
    direction,
  }: {
    organId: number;
    x: number;
    y: number;
    organType: CellType;
    direction?: OrganDirection;
  }) {
    super();
    this.organId = organId;
    this.x = x;
    this.y = y;
    this.organType = organType;
    this.direction = direction ?? "X";
  }

  toString(): string {
    return `${this.type} ${this.organId} ${this.x} ${this.y} ${this.organType} ${this.direction}`;
  }
}

function getDirection(a: Cell, b: Cell): OrganDirection {
  if (a.x === b.x) {
    return a.y < b.y ? "S" : "N";
  } else {
    return a.x < b.x ? "E" : "W";
  }
}

function growHarvester(gameState: GameState): Action {
  const myCells = gameState.myCells;
  const myRoots = myCells.filter((cell) => cell.type === "ROOT");

  const root = myRoots[0];

  const closestProteinCell = gameState.findClosestProteinCell();

  if (!closestProteinCell) {
    return new WaitAction();
  }

  const direction = getDirection(root, closestProteinCell);
  const x =
    direction === "E"
      ? closestProteinCell.x - 1
      : direction === "W"
      ? closestProteinCell.x + 1
      : closestProteinCell.x;
  const y =
    direction === "N"
      ? closestProteinCell.y - 1
      : direction === "S"
      ? closestProteinCell.y + 1
      : closestProteinCell.y;

  return new GrowAction({
    organId: root.organId,
    x,
    y,
    organType: "HARVESTER",
    direction: direction,
  });
}

function growBasicOrgan(gameState: GameState): Action {
  const myCells = gameState.myCells;
  const myRoots = myCells.filter((cell) => cell.type === "ROOT");

  const root = myRoots[0];
  const closestProteinCell = gameState.findClosestProteinCell();

  if (!closestProteinCell) {
    for (let i = 0; i < myCells.length; i++) {
      const northCell = gameState.cells[myCells[i].x][myCells[i].y - 1];
      const southCell = gameState.cells[myCells[i].x][myCells[i].y + 1];
      const eastCell = gameState.cells[myCells[i].x + 1][myCells[i].y];
      const westCell = gameState.cells[myCells[i].x - 1][myCells[i].y];

      console.error("myCell", gameState.cells[myCells[i].x][myCells[i].y]);
      console.error("northCell", northCell);
      console.error("southCell", southCell);
      console.error("eastCell", eastCell);
      console.error("westCell", westCell);

      if (!northCell) {
        return new GrowAction({
          organId: root.organId,
          x: myCells[i].x,
          y: myCells[i].y - 1,
          organType: "BASIC",
        });
      }
      if (!southCell) {
        return new GrowAction({
          organId: root.organId,
          x: myCells[i].x,
          y: myCells[i].y + 1,
          organType: "BASIC",
        });
      }
      if (!eastCell) {
        return new GrowAction({
          organId: root.organId,
          x: myCells[i].x + 1,
          y: myCells[i].y,
          organType: "BASIC",
        });
      }
      if (!westCell) {
        return new GrowAction({
          organId: root.organId,
          x: myCells[i].x - 1,
          y: myCells[i].y,
          organType: "BASIC",
        });
      }
    }
    return new WaitAction();
  }

  return new GrowAction({
    organId: root.organId,
    x: closestProteinCell.x,
    y: closestProteinCell.y,
    organType: "BASIC",
  });
}

interface DecisionTreeNode<T> {
  condition?: (input: T) => boolean;
  yes?: DecisionTreeNode<T>;
  no?: DecisionTreeNode<T>;
  action?: (input: T) => Action;
}

const decisionTree: DecisionTreeNode<GameState> = {
  condition: (gameState: GameState) => {
    return gameState.canGrowHarvester();
  },
  yes: {
    action: growHarvester,
  },
  no: {
    action: growBasicOrgan,
  },
};

function evaluateDecisionTree<T>(node: DecisionTreeNode<T>, input: T): Action {
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

class GameState {
  private _cells: Cell[][] = [[]];
  private _myProteinStock: ProteinStock = new ProteinStock({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  });
  private _opponentProteinStock: ProteinStock = new ProteinStock({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  });
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  get cells(): Cell[][] {
    return this._cells;
  }

  set cells(cells: Cell[][]) {
    this._cells = cells;
  }

  get myCells(): Cell[] {
    return this.cells.flat().filter((cell) => cell.owner === Owner.ME);
  }

  get opponentCells(): Cell[] {
    return this.cells.flat().filter((cell) => cell.owner === Owner.OPPONENT);
  }

  get nuetralCells(): Cell[] {
    return this.cells
      .flat()
      .filter((cell) => cell.owner === Owner.NEUTRAL && cell.type !== "WALL");
  }

  getNeutralCellThatIsNotProtein(): Cell | null {
    return (
      this.nuetralCells.filter((cell) => cell.type === undefined)?.[0] ?? null
    );
  }

  hasHarvestableProtein(): boolean {
    return this.getProteinCells().length >= 1;
  }

  canGrowHarvester(): boolean {
    return (
      this.myProteinStock.C >= 1 &&
      this.myProteinStock.D >= 1 &&
      this.hasHarvestableProtein() &&
      this.proteinInRange()
    );
  }

  proteinInRange(): boolean {
    const myCells = this.myCells;
    return myCells.some((cell) => {
      return (
        ["A", "B", "C", "D"].includes(this.cells[cell.x + 2]?.[cell.y]?.type) ||
        ["A", "B", "C", "D"].includes(this.cells[cell.x - 2]?.[cell.y]?.type) ||
        ["A", "B", "C", "D"].includes(this.cells[cell.x]?.[cell.y + 2]?.type) ||
        ["A", "B", "C", "D"].includes(this.cells[cell.x]?.[cell.y - 2]?.type)
      );
    });
  }

  getProteinCells(): Cell[] {
    return this.cells
      .flat()
      .filter((cell) => ["A", "B", "C", "D"].includes(cell.type));
  }

  getHarvestableProteinCells(): Cell[] {
    return this.cells
      .flat()
      .filter((cell) => ["A", "B", "C", "D"].includes(cell.type))
      .filter((cell) => !cell.hasHarvester(this.cells));
  }

  addCell(cell: Cell) {
    if (!Array.isArray(this.cells[cell.x])) {
      this.cells[cell.x] = [];
    }
    this.cells[cell.x][cell.y] = cell;
  }

  get myProteinStock(): ProteinStock {
    return this._myProteinStock;
  }

  set myProteinStock(proteinStock: ProteinStock) {
    this._myProteinStock = proteinStock;
  }

  get opponentProteinStock(): ProteinStock {
    return this._opponentProteinStock;
  }

  set opponentProteinStock(proteinStock: ProteinStock) {
    this._opponentProteinStock = proteinStock;
  }

  cleanUpTurn() {
    this.cells = [];
  }

  findClosestProteinCell(): Cell | null {
    const harvestableProteinCells = this.getHarvestableProteinCells();
    const myCells = this.myCells;
    let closestCell: Cell | null = null;
    let closestDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < harvestableProteinCells.length; i++) {
      const distance = calculateDistance(
        harvestableProteinCells[i],
        myCells[0]
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCell = harvestableProteinCells[i];
      }
    }
    return closestCell;
  }
}

const Owner = {
  ME: 1,
  OPPONENT: 0,
  NEUTRAL: -1,
} as const;

type CellType =
  | "WALL"
  | "ROOT"
  | "BASIC"
  | "TENTACLE"
  | "HARVESTER"
  | "SPORER"
  | "A"
  | "B"
  | "C"
  | "D";

type OrganDirection = "N" | "E" | "S" | "W" | "X";

class Cell {
  public readonly x: number;
  public readonly y: number;
  public readonly type: CellType;
  public readonly owner: number;
  public readonly organId: number;
  public readonly organDir: OrganDirection;
  public readonly organParentId: number;
  public readonly organRootId: number;

  constructor({
    x,
    y,
    type,
    owner,
    organId,
    organDir,
    organParentId,
    organRootId,
  }: {
    x: number;
    y: number;
    type: CellType;
    owner: number;
    organId: number;
    organDir: OrganDirection;
    organParentId: number;
    organRootId: number;
  }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.owner = owner;
    this.organId = organId;
    this.organDir = organDir;
    this.organParentId = organParentId;
    this.organRootId = organRootId;
  }

  hasHarvester(cells: Cell[][]): boolean {
    return (
      cells[this.x + 1][this.y]?.type === "HARVESTER" ||
      cells[this.x - 1][this.y]?.type === "HARVESTER" ||
      cells[this.x][this.y + 1]?.type === "HARVESTER" ||
      cells[this.x][this.y - 1]?.type === "HARVESTER"
    );
  }

  isProteinCell(): boolean {
    return ["A", "B", "C", "D"].includes(this.type);
  }
}

class ProteinStock {
  public readonly A: number;
  public readonly B: number;
  public readonly C: number;
  public readonly D: number;

  constructor({ A, B, C, D }: { A: number; B: number; C: number; D: number }) {
    this.A = A;
    this.B = B;
    this.C = C;
    this.D = D;
  }
}

var inputs: string[] = readline().split(" ");
const width: number = parseInt(inputs[0]); // columns in the game grid
const height: number = parseInt(inputs[1]); // rows in the game grid

const gameState = new GameState(width, height);

// game loop
while (true) {
  const entityCount: number = parseInt(readline());
  for (let i = 0; i < entityCount; i++) {
    var inputs: string[] = readline().split(" ");
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]); // grid coordinate
    const type: string = inputs[2]; // WALL, ROOT, BASIC, TENTACLE, HARVESTER, SPORER, A, B, C, D
    const owner: number = parseInt(inputs[3]); // 1 if your organ, 0 if enemy organ, -1 if neither
    const organId: number = parseInt(inputs[4]); // id of this entity if it's an organ, 0 otherwise
    const organDir: string = inputs[5]; // N,E,S,W or X if not an organ
    const organParentId: number = parseInt(inputs[6]);
    const organRootId: number = parseInt(inputs[7]);

    gameState.addCell(
      new Cell({
        x,
        y,
        type: type as CellType,
        owner,
        organId,
        organDir: organDir as OrganDirection,
        organParentId,
        organRootId,
      })
    );
  }
  var inputs: string[] = readline().split(" ");
  const myA: number = parseInt(inputs[0]);
  const myB: number = parseInt(inputs[1]);
  const myC: number = parseInt(inputs[2]);
  const myD: number = parseInt(inputs[3]); // your protein stock

  gameState.myProteinStock = new ProteinStock({
    A: myA,
    B: myB,
    C: myC,
    D: myD,
  });

  var inputs: string[] = readline().split(" ");
  const oppA: number = parseInt(inputs[0]);
  const oppB: number = parseInt(inputs[1]);
  const oppC: number = parseInt(inputs[2]);
  const oppD: number = parseInt(inputs[3]); // opponent's protein stock

  gameState.opponentProteinStock = new ProteinStock({
    A: oppA,
    B: oppB,
    C: oppC,
    D: oppD,
  });

  const requiredActionsCount: number = parseInt(readline()); // your number of organisms, output an action for each one in any order
  for (let i = 0; i < requiredActionsCount; i++) {
    // Write an action using console.log()
    // To debug: console.error('Debug messages...');
    console.error("requiredActionsCount", requiredActionsCount);
    const command = evaluateDecisionTree(decisionTree, gameState);
    console.log(command.toString());
  }
  gameState.cleanUpTurn();
}
