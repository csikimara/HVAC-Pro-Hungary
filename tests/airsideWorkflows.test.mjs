import assert from 'node:assert/strict';
import {
  classifyVelocity,
  distributionRecommendation,
  designSpigotBranchNetwork,
  ductVelocity,
  pairedSupplyReturnRecommendation,
  recommendedDiameter,
  recommendedResidentialSupply,
  recommendedWetRoomExtract,
  roundSpigotDistribution,
} from '../domain/airsideWorkflows.ts';

function close(actual, expected, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} ± ${tolerance}`);
}

const velocity = ductVelocity(500, 200);
close(velocity, 4.421, 0.002);
assert.equal(classifyVelocity(velocity, 'main'), 'office');
assert.equal(recommendedDiameter(500, 'main', 'comfort'), 250);

const distribution = distributionRecommendation(600, 2, 3, 1);
assert.ok(distribution);
close(distribution.trunkFlow, 600);
close(distribution.supplyBranchFlow, 300);
close(distribution.extractBranchFlow, 200);
assert.ok(distribution.comfort.trunkDiameterMm >= distribution.office.trunkDiameterMm);

const living = recommendedResidentialSupply('living', 25, 3, 3.2);
assert.ok(living);
close(living.volumeM3, 80);
close(living.roomScheduleM3h, 53.1);
close(living.personCheckM3h, 75.6);
close(living.recommendedM3h, 75.6);
close(living.resultingAirChangesPerHour, 0.945);
const livingAtDefaultHeight = recommendedResidentialSupply('living', 25, 3, 2.7);
assert.ok(livingAtDefaultHeight);
close(livingAtDefaultHeight.recommendedM3h, living.recommendedM3h);
assert.notEqual(livingAtDefaultHeight.resultingAirChangesPerHour, living.resultingAirChangesPerHour);

const bathroom = recommendedWetRoomExtract('bathroom', 6, 2.6);
assert.ok(bathroom);
close(bathroom.standardMinimumM3h, 54);
close(bathroom.volumeCheckM3h, 93.6);
close(bathroom.recommendedM3h, 93.6);

console.log('airsideWorkflows: 17 ellenőrzés rendben');

const fourToSix = roundSpigotDistribution(600, 6, 4);
assert.ok(fourToSix);
assert.equal(fourToSix.minimumYSplits, 2);
assert.equal(fourToSix.directBranches, 2);
assert.equal(fourToSix.maximumSpigotFlowM3h, 200);
assert.equal(fourToSix.terminalFlowM3h, 100);

console.log('airsideWorkflows: a 4 csonk → 6 végpont Y-osztása rendben');

const paired = pairedSupplyReturnRecommendation(600, 6, 4, 'comfort');
assert.ok(paired);
assert.equal(paired.mirroredYSplit, true);
assert.equal(paired.supply.startDiameterMm, paired.return.startDiameterMm);
assert.equal(paired.supply.roomDiameterMm, paired.return.roomDiameterMm);
assert.equal(paired.startFlowM3h, 200);
assert.equal(paired.roomFlowM3h, 100);
console.log('airsideWorkflows: páros befúvó-visszaszívó ág és tükrözött Y-osztás rendben');

const unequalTree = designSpigotBranchNetwork([
  { id: 'living', label: 'Nappali', airflowM3h: 220 },
  { id: 'bed1', label: 'Háló 1', airflowM3h: 100 },
  { id: 'bed2', label: 'Háló 2', airflowM3h: 90 },
  { id: 'office', label: 'Dolgozó', airflowM3h: 70 },
  { id: 'child1', label: 'Gyerekszoba 1', airflowM3h: 60 },
  { id: 'child2', label: 'Gyerekszoba 2', airflowM3h: 60 },
], 2, 'comfort');
assert.ok(unequalTree);
assert.equal(unequalTree.totalAirflowM3h, 600);
assert.equal(unequalTree.totalSplits, 4);
assert.ok(unequalTree.maximumSplitDepth >= 2);
assert.equal(unequalTree.spigots.reduce((sum, item) => sum + item.airflowM3h, 0), 600);
assert.equal(unequalTree.pairedReturnMirrorsSupply, true);
console.log('airsideWorkflows: eltérő helyiségi légmennyiségek és többlépcsős Y-fa rendben');
