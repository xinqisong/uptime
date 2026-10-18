import { mkdir, readFile, writeFile } from 'node:fs/promises'

const expected = new Map([
  ['personal-site', 'https://istsong.com/'],
  ['www', 'https://www.istsong.com/'],
  ['blog', 'https://blog.istsong.com/'],
])
const summary = JSON.parse(await readFile('history/summary.json', 'utf8'))
if (!Array.isArray(summary) || summary.length !== expected.size) {
  throw new Error('Expected exactly three real Upptime results')
}
const seen = new Set()
const sites = summary.map(({ slug, name, url, status, time, uptime }) => {
  if (expected.get(slug) !== url || seen.has(slug) || !['up', 'down', 'degraded'].includes(status)) {
    throw new Error('Unexpected monitor result')
  }
  seen.add(slug)
  return { slug, name, url, status, responseTime: time, uptime }
})
await mkdir('api', { recursive: true })
await writeFile('api/status.json', JSON.stringify({ checkedAt: new Date().toISOString(), sites }, null, 2) + '\n')
console.log('Exported the three checked monitors with a freshness timestamp')
