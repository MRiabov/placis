import { asNumber, pick } from "./valueParsers";

export function float32ToPcm16(input: Float32Array): Uint8Array {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    view.setInt16(
      index * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    );
  }
  return output;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index) ?? 0;
  }
  return bytes;
}

export function audioSampleRate(
  format: Record<string, unknown> | undefined,
): number {
  const rate =
    asNumber(pick(format, "sample_rate_hz")) ??
    asNumber(pick(format, "sampleRate")) ??
    asNumber(pick(format, "rate"));
  return rate && rate > 0 ? rate : 24_000;
}
