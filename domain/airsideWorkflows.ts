export type VelocityLocation = 'main' | 'branch' | 'terminal';
export type VelocityBand = 'comfort' | 'office' | 'noisy';

export const STANDARD_ROUND_DIAMETERS_MM = [80, 100, 125, 150, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630] as const;

export const VELOCITY_LIMITS: Record<VelocityLocation, { comfort: number; office: number }> = {
  main: { comfort: 3, office: 5 },
  branch: { comfort: 2.5, office: 4 },
  terminal: { comfort: 2, office: 3 },
};

export function ductVelocity(airflowM3h: number, diameterMm: number): number {
  if (airflowM3h <= 0 || diameterMm <= 0) return 0;
  const diameterM = diameterMm / 1000;
  return (airflowM3h / 3600) / (Math.PI * diameterM * diameterM / 4);
}

export function classifyVelocity(velocityMs: number, location: VelocityLocation): VelocityBand {
  const limits = VELOCITY_LIMITS[location];
  if (velocityMs <= limits.comfort) return 'comfort';
  if (velocityMs <= limits.office) return 'office';
  return 'noisy';
}

export function airflowAtVelocity(diameterMm: number, velocityMs: number): number {
  if (diameterMm <= 0 || velocityMs <= 0) return 0;
  const diameterM = diameterMm / 1000;
  return Math.PI * diameterM * diameterM / 4 * velocityMs * 3600;
}

export function recommendedDiameter(airflowM3h: number, location: VelocityLocation, band: Exclude<VelocityBand, 'noisy'> = 'comfort'): number {
  const limit = VELOCITY_LIMITS[location][band];
  return STANDARD_ROUND_DIAMETERS_MM.find(diameter => ductVelocity(airflowM3h, diameter) <= limit)
    ?? STANDARD_ROUND_DIAMETERS_MM[STANDARD_ROUND_DIAMETERS_MM.length - 1];
}

export function recommendedResidentialSupply(roomType: 'living' | 'bedroom', areaM2: number, occupants: number, heightM = 2.7) {
  if (areaM2 <= 0 || occupants < 0 || heightM <= 0) return null;
  const roomScheduleLs = roomType === 'living'
    ? (areaM2 > 15 ? 8 + 0.27 * areaM2 : areaM2 >= 11 ? 12 : 8)
    : (areaM2 > 15 ? 14 : areaM2 >= 11 ? 12 : 8);
  const personCheckLs = occupants * 7;
  const selectedLs = Math.max(roomScheduleLs, personCheckLs);
  const volumeM3 = areaM2 * heightM;
  return {
    volumeM3,
    roomScheduleM3h: roomScheduleLs * 3.6,
    personCheckM3h: personCheckLs * 3.6,
    recommendedM3h: selectedLs * 3.6,
    resultingAirChangesPerHour: selectedLs * 3.6 / volumeM3,
  };
}

export function recommendedWetRoomExtract(roomType: 'bathroom' | 'wc' | 'combined', areaM2: number, heightM: number) {
  if (areaM2 <= 0 || heightM <= 0) return null;
  const standardMinimumM3h = (roomType === 'bathroom' ? 15 : roomType === 'wc' ? 10 : 20) * 3.6;
  const volumeM3 = areaM2 * heightM;
  const volumeCheckM3h = volumeM3 * 6;
  return {
    volumeM3,
    standardMinimumM3h,
    volumeCheckM3h,
    recommendedM3h: Math.max(standardMinimumM3h, volumeCheckM3h),
  };
}

export function distributionRecommendation(totalAirflowM3h: number, supplyOutlets: number, extractOutlets: number, trunks: 1 | 2) {
  if (totalAirflowM3h <= 0 || supplyOutlets < 1 || extractOutlets < 1) return null;
  const trunkFlow = totalAirflowM3h / trunks;
  const supplyBranchFlow = totalAirflowM3h / supplyOutlets;
  const extractBranchFlow = totalAirflowM3h / extractOutlets;
  return {
    trunkFlow,
    supplyBranchFlow,
    extractBranchFlow,
    comfort: {
      trunkDiameterMm: recommendedDiameter(trunkFlow, 'main', 'comfort'),
      supplyBranchDiameterMm: recommendedDiameter(supplyBranchFlow, 'branch', 'comfort'),
      extractBranchDiameterMm: recommendedDiameter(extractBranchFlow, 'branch', 'comfort'),
    },
    office: {
      trunkDiameterMm: recommendedDiameter(trunkFlow, 'main', 'office'),
      supplyBranchDiameterMm: recommendedDiameter(supplyBranchFlow, 'branch', 'office'),
      extractBranchDiameterMm: recommendedDiameter(extractBranchFlow, 'branch', 'office'),
    },
  };
}

export function roundSpigotDistribution(totalAirflowM3h: number, terminalCount: number, machineSpigotCount: number) {
  if (totalAirflowM3h <= 0 || terminalCount < 1 || machineSpigotCount < 1) return null;
  const usedSpigots = Math.min(terminalCount, machineSpigotCount);
  const terminalFlowM3h = totalAirflowM3h / terminalCount;
  const maximumTerminalsOnOneSpigot = Math.ceil(terminalCount / usedSpigots);
  const maximumSpigotFlowM3h = terminalFlowM3h * maximumTerminalsOnOneSpigot;
  const minimumYSplits = Math.max(0, terminalCount - usedSpigots);
  const directBranches = Math.max(0, usedSpigots - minimumYSplits);
  const requiresMultipleSplitStages = terminalCount > machineSpigotCount * 2;
  return {
    usedSpigots,
    unusedSpigots: Math.max(0, machineSpigotCount - usedSpigots),
    terminalFlowM3h,
    maximumTerminalsOnOneSpigot,
    maximumSpigotFlowM3h,
    minimumYSplits,
    directBranches,
    requiresMultipleSplitStages,
    comfort: {
      machineBranchDiameterMm: recommendedDiameter(maximumSpigotFlowM3h, 'branch', 'comfort'),
      terminalBranchDiameterMm: recommendedDiameter(terminalFlowM3h, 'branch', 'comfort'),
    },
    office: {
      machineBranchDiameterMm: recommendedDiameter(maximumSpigotFlowM3h, 'branch', 'office'),
      terminalBranchDiameterMm: recommendedDiameter(terminalFlowM3h, 'branch', 'office'),
    },
  };
}

/** A room-by-room return mirrors the supply airflow and nominal branch size. */
export function pairedSupplyReturnRecommendation(totalAirflowM3h: number, terminalCount: number, machineSpigotCount: number, band: Exclude<VelocityBand, 'noisy'> = 'comfort', designRoomFlowM3h?: number) {
  const distribution = roundSpigotDistribution(totalAirflowM3h, terminalCount, machineSpigotCount);
  if (!distribution) return null;
  const roomFlowM3h = designRoomFlowM3h && designRoomFlowM3h > 0 ? designRoomFlowM3h : distribution.terminalFlowM3h;
  const startFlowM3h = distribution.minimumYSplits > 0 ? roomFlowM3h * 2 : roomFlowM3h;
  const startDiameterMm = recommendedDiameter(startFlowM3h, 'branch', band);
  const roomDiameterMm = recommendedDiameter(roomFlowM3h, 'branch', band);
  return {
    startFlowM3h,
    roomFlowM3h,
    supply: { startDiameterMm, roomDiameterMm },
    return: { startDiameterMm, roomDiameterMm },
    mirroredYSplit: distribution.minimumYSplits > 0,
  };
}

export interface AirTerminalDemand {
  id: string;
  label: string;
  airflowM3h: number;
}

export interface AirBranchNode {
  id: string;
  airflowM3h: number;
  diameterMm: number;
  depth: number;
  terminal?: AirTerminalDemand;
  children?: [AirBranchNode, AirBranchNode];
}

export interface SpigotBranchPlan {
  spigotIndex: number;
  airflowM3h: number;
  terminalCount: number;
  splitCount: number;
  maximumSplitDepth: number;
  root: AirBranchNode;
}

function splitBalancedByFlow(terminals: AirTerminalDemand[]): [AirTerminalDemand[], AirTerminalDemand[]] {
  const left: AirTerminalDemand[] = [];
  const right: AirTerminalDemand[] = [];
  let leftFlow = 0;
  let rightFlow = 0;
  for (const terminal of [...terminals].sort((a, b) => b.airflowM3h - a.airflowM3h)) {
    if (leftFlow <= rightFlow) { left.push(terminal); leftFlow += terminal.airflowM3h; }
    else { right.push(terminal); rightFlow += terminal.airflowM3h; }
  }
  return [left, right];
}

function branchNode(terminals: AirTerminalDemand[], band: Exclude<VelocityBand, 'noisy'>, depth: number, id: string): AirBranchNode {
  const airflowM3h = terminals.reduce((sum, terminal) => sum + terminal.airflowM3h, 0);
  if (terminals.length === 1) {
    return { id, airflowM3h, diameterMm: recommendedDiameter(airflowM3h, 'branch', band), depth, terminal: terminals[0] };
  }
  const [left, right] = splitBalancedByFlow(terminals);
  return {
    id,
    airflowM3h,
    diameterMm: recommendedDiameter(airflowM3h, 'branch', band),
    depth,
    children: [branchNode(left, band, depth + 1, `${id}a`), branchNode(right, band, depth + 1, `${id}b`)],
  };
}

function nodeStats(node: AirBranchNode): { terminals: number; splits: number; maxDepth: number } {
  if (!node.children) return { terminals: 1, splits: 0, maxDepth: node.depth };
  const a = nodeStats(node.children[0]);
  const b = nodeStats(node.children[1]);
  return { terminals: a.terminals + b.terminals, splits: a.splits + b.splits + 1, maxDepth: Math.max(a.maxDepth, b.maxDepth) };
}

/**
 * Balances unequal room airflows across the available factory spigots, then builds
 * a complete binary Y-branch tree. The paired return can mirror the same tree.
 */
export function designSpigotBranchNetwork(terminals: AirTerminalDemand[], machineSpigotCount: number, band: Exclude<VelocityBand, 'noisy'> = 'comfort') {
  const valid = terminals.filter(item => item.airflowM3h > 0 && Number.isFinite(item.airflowM3h));
  if (valid.length === 0 || machineSpigotCount < 1) return null;
  const groupCount = Math.min(machineSpigotCount, valid.length);
  const groups: AirTerminalDemand[][] = Array.from({ length: groupCount }, () => []);
  const groupFlows = Array.from({ length: groupCount }, () => 0);
  for (const terminal of [...valid].sort((a, b) => b.airflowM3h - a.airflowM3h)) {
    let target = 0;
    for (let index = 1; index < groupCount; index += 1) if (groupFlows[index] < groupFlows[target]) target = index;
    groups[target].push(terminal);
    groupFlows[target] += terminal.airflowM3h;
  }
  const spigots: SpigotBranchPlan[] = groups.map((group, index) => {
    const root = branchNode(group, band, 0, `S${index + 1}`);
    const stats = nodeStats(root);
    return { spigotIndex: index + 1, airflowM3h: root.airflowM3h, terminalCount: stats.terminals, splitCount: stats.splits, maximumSplitDepth: stats.maxDepth, root };
  });
  return {
    totalAirflowM3h: valid.reduce((sum, item) => sum + item.airflowM3h, 0),
    usedSpigots: spigots.length,
    unusedSpigots: Math.max(0, machineSpigotCount - spigots.length),
    totalSplits: spigots.reduce((sum, item) => sum + item.splitCount, 0),
    maximumSplitDepth: Math.max(...spigots.map(item => item.maximumSplitDepth)),
    spigots,
    pairedReturnMirrorsSupply: true,
  };
}
