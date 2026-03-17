export function buildImagePayload(file) {
  if (!file) {
    return undefined;
  }

  return {
    data: file.buffer,
    contentType: file.mimetype,
  };
}
