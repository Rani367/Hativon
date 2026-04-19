export function writeStdoutLine(message: string): void {
  if (typeof process !== "undefined" && process.stdout) {
    process.stdout.write(`${message}\n`);
    return;
  }

  console.warn(message);
}
