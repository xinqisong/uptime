import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const expected = new Map([
  ['personal-site', 'https://istsong.com/'],
  ['www', 'https://www.istsong.com/'],
  ['blog', 'https://blog.istsong.com/'],
])
const summary = JSON.parse(await readFile('history/summary.json', 'utf8'))
if (!Array.isArray(summary) || summary.length !== expected.size) throw new Error('Expected three real monitors')
const field = (text, key) => text.match(new RegExp(`^${key}:\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '')
const seen = new Set()
const sites = await Promise.all(summary.map(async ({ slug, name, url, status, time, uptime }) => {
  if (!expected.has(slug) || expected.get(slug) !== url || seen.has(slug) || !['up', 'down', 'degraded'].includes(status)) {
    throw new Error('Unexpected monitor result')
  }
  seen.add(slug)
  const file = `history/${slug}.yml`
  const current = await readFile(file, 'utf8')
  const hashes = execFileSync('git', ['log', '--format=%H', '--max-count=30', '--', file], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const samples = hashes.map(hash => {
    const content = execFileSync('git', ['show', `${hash}:${file}`], { encoding: 'utf8' })
    return { at: field(content, 'lastUpdated'), ms: Number(field(content, 'responseTime')) }
  }).filter(sample => Number.isFinite(sample.ms) && sample.ms >= 0 && Number.isFinite(Date.parse(sample.at))).reverse()
  return {
    slug, name, url, status, responseTime: Number(field(current, 'responseTime')),
    averageResponseTime: time, code: Number(field(current, 'code')), uptime,
    startTime: field(current, 'startTime'), samples,
  }
}))
if (!process.env.GH_TOKEN) throw new Error('The workflow repository token is required')
const response = await fetch('https://api.github.com/repos/xinqisong/uptime/issues?state=all&labels=status&per_page=20', {
  headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
})
if (!response.ok) throw new Error(`Could not retrieve incident records: ${response.status}`)
const issues = await response.json()
if (!Array.isArray(issues)) throw new Error('Invalid incident response')
const incidents = issues.filter(issue => !issue.pull_request).map(({ number, title, html_url, state, created_at, closed_at }) => ({
  number, title, url: html_url, state, startedAt: created_at, closedAt: closed_at,
}))
await mkdir('api', { recursive: true })
await writeFile('api/status.json', JSON.stringify({ checkedAt: new Date().toISOString(), sites, incidents }, null, 2) + '\n')
console.log(`Exported ${sites.length} real monitors and ${incidents.length} incident records`)
