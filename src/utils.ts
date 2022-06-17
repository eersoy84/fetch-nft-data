export const OPENSEA_CONTRACT_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e';

export function bufferToBase64Uri(buffer: Buffer): string {
  if (buffer.slice(0, 8).equals(Buffer.from('89504E470D0A1A0A', 'hex'))) {
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
  if (buffer.slice(0, 2).equals(Buffer.from('FFD8', 'hex')) && buffer.slice(-2).equals(Buffer.from('FFD9', 'hex'))) {
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }
  if (buffer.slice(0, 5).equals(Buffer.from('<svg ', 'ascii'))) {
    return `data:image/svg+xml;base64,${buffer.toString('base64')}`;
  }
  if (buffer.slice(0, 3).equals(Buffer.from('GIF ', 'ascii'))) {
    return `data:image/gif;base64,${buffer.toString('base64')}`;
  }
  return '';
}
