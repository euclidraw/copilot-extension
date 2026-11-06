/** Never accept model-supplied operations as a privileged extension plan. */
export async function invokeExtensionTool(tools, id, input, context, signal, onProposal) {
  const result = await tools.invoke(id, input, signal);
  signal.throwIfAborted();
  if (!result?.changeProposalId) return result;
  if (!tools.getChangeProposal) throw Error('Host update required for extension change approvals');
  const proposal = tools.getChangeProposal(result.changeProposalId);
  if (proposal.documentId !== context.documentId) throw Error('CONFLICT: document is no longer active');
  onProposal(proposal);
  return { ...result, status: 'awaiting-user-approval' };
}
