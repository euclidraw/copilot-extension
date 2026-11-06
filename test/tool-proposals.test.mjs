import test from 'node:test';
import assert from 'node:assert/strict';
import { invokeExtensionTool } from '../src/tool-proposals.js';

test('extension plans use authoritative host operations, not model/tool output copies', async () => {
  const proposals = [], proposal = { id: 'p', documentId: 'doc', operations: [{ id: 'new', aspect: 'diagram.genogram.person', patch: {} }] };
  const tools = { invoke: async () => ({ changeProposalId: 'p', operations: ['untrusted copy'] }), getChangeProposal: () => proposal };
  const result = await invokeExtensionTool(tools, 'tool', {}, { documentId: 'doc' }, new AbortController().signal, value => proposals.push(value));
  assert.equal(result.status, 'awaiting-user-approval');
  assert.equal(proposals[0], proposal);
});
test('cancellation, document replacement and unsupported hosts never publish proposals', async () => {
  const controller = new AbortController(), tools = { invoke: async () => ({ changeProposalId: 'p' }), getChangeProposal: () => ({ documentId: 'other' }) };
  const publish = () => assert.fail('must not publish');
  await assert.rejects(invokeExtensionTool(tools, 'tool', {}, { documentId: 'doc' }, controller.signal, publish), /CONFLICT/);
  controller.abort();
  await assert.rejects(invokeExtensionTool(tools, 'tool', {}, { documentId: 'doc' }, controller.signal, publish), /abort/i);
  await assert.rejects(invokeExtensionTool({ invoke: tools.invoke }, 'tool', {}, { documentId: 'doc' }, new AbortController().signal, publish), /Host update/);
});
