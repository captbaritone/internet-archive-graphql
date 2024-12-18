// Credit: ChatGPT
export async function listZipContents(url: string) {
  // Fetch the last 22 bytes (end of central directory record)
  const endSize = 22;
  const endResponse = await fetch(url, {
    headers: { Range: `bytes=-${endSize}` },
  });
  const endBuffer = await endResponse.arrayBuffer();

  const endView = new DataView(endBuffer);
  const centralDirOffset = endView.getUint32(endSize - 6, true); // Offset of central directory
  const centralDirSize = endView.getUint32(endSize - 12, true); // Size of central directory

  // Fetch the central directory
  const centralResponse = await fetch(url, {
    headers: {
      Range: `bytes=${centralDirOffset}-${
        centralDirOffset + centralDirSize - 1
      }`,
    },
  });
  const centralBuffer = await centralResponse.arrayBuffer();

  // Parse the central directory
  const centralView = new DataView(centralBuffer);
  let offset = 0;
  const fileNames = [];

  while (offset < centralDirSize) {
    const signature = centralView.getUint32(offset, true);
    if (signature !== 0x02014b50) break; // Central file header signature

    const fileNameLength = centralView.getUint16(offset + 28, true);
    const extraFieldLength = centralView.getUint16(offset + 30, true);
    const commentLength = centralView.getUint16(offset + 32, true);

    const fileNameOffset = offset + 46; // File name starts after fixed header
    const fileName = new TextDecoder().decode(
      new Uint8Array(centralBuffer, fileNameOffset, fileNameLength)
    );

    fileNames.push(fileName);
    offset += 46 + fileNameLength + extraFieldLength + commentLength; // Move to next header
  }

  return fileNames;
}
