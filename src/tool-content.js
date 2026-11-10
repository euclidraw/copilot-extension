const MAX_TOOL_IMAGES = 2;

/** Model-facing tool result: text metadata plus at most two rendered snapshots. */
export function toolContent(result, images) {
  const content = [{ type: 'text', text: JSON.stringify(result) }];
  for (const image of Array.isArray(images) ? images.slice(0, MAX_TOOL_IMAGES) : []) {
    if (typeof image?.data === 'string' && typeof image?.mimeType === 'string') {
      content.push({ type: 'image', data: image.data, mimeType: image.mimeType });
    }
  }
  return content;
}
