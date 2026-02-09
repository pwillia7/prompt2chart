export function sampleData<T>(data: T[], threshold = 5000): T[] {
  if (data.length <= threshold) return data
  const step = data.length / threshold
  const sampled: T[] = []
  for (let i = 0; i < threshold; i++) {
    sampled.push(data[Math.floor(i * step)])
  }
  return sampled
}
