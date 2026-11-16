import assert from 'node:assert/strict';
import { createFlowCalculationDraft, HVAC_FLOW_SCHEMA_VERSION } from '../domain/northwindFlowBridge.ts';

const draft = createFlowCalculationDraft('local-1', 'Minta családi ház', [
  { id: 'room-1', name: 'Nappali', areaM2: 25, heightM: 2.7, coolingLoadKw: 2.4, updatedAt: '2026-10-26T00:00:00.000Z' },
  { id: 'room-2', name: 'Háló', areaM2: 14, heightM: 2.7, coolingLoadKw: 1.1, updatedAt: '2026-10-26T00:00:00.000Z' },
], { tenantId: 'tenant', customerId: 'customer', customerSiteId: 'site' });
assert.equal(draft.schemaVersion, HVAC_FLOW_SCHEMA_VERSION);
assert.equal(draft.sourceApp, 'hvac-pro-hungary');
assert.equal(draft.rooms.length, 2);
assert.equal(draft.totalCoolingLoadKw, 3.5);
assert.equal(draft.accuracy.level, 'engineering-estimate');
assert.equal(draft.accuracy.mode, 'guided-estimate');
assert.equal(draft.flowLink?.customerSiteId, 'site');
assert.equal(JSON.parse(JSON.stringify(draft)).localProjectId, 'local-1');
console.log('northwindFlowBridge: verziózott projektcsomag és Flow-hivatkozások rendben');
