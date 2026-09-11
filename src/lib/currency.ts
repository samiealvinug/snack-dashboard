export function ugx(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `UGX ${rounded.toLocaleString("en-UG")}`;
}

export function num(amount: number): string {
  return Math.round(amount || 0).toLocaleString("en-UG");
}
