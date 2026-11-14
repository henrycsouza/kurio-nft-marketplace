import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { preview } from 'vite'

const args = new Map(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')))
const label = args.get('label') ?? 'latest'
const runs = Number(args.get('runs') ?? 3)
const device = args.get('device') ?? 'both'
if (!/^[a-z0-9-]+$/i.test(label) || !Number.isInteger(runs) || runs < 1 || runs > 5 || !['both', 'mobile', 'desktop'].includes(device)) {
  throw new Error('Use --label=nome, --runs=1..5 e --device=both|mobile|desktop')
}
const directory = resolve('artifacts/lighthouse', label)
await mkdir(directory, { recursive: true })
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true, open: false } })
const allPages = [{ name: 'home', path: '/' }, { name: 'detail', path: '/nft/emerald-ape-042' }]
const pageName = args.get('page') ?? 'both'
if (!['both', 'home', 'detail'].includes(pageName)) throw new Error('Use --page=both|home|detail')
const pages = allPages.filter((page) => pageName === 'both' || page.name === pageName)
const results = []
try {
  for (const page of pages) {
  for (const device of deviceList()) {
    for (let run = 1; run <= runs; run++) {
      const output = resolve(directory, `${page.name}-${device}-${run}`)
      console.log(`Lighthouse: ${device}, execução ${run}/${runs}`)
      await new Promise((done, reject) => {
        const child = spawn(process.execPath, [
          resolve('node_modules/lighthouse/cli/index.js'), `http://127.0.0.1:4173${page.path}`,
          '--only-categories=performance,accessibility,best-practices,seo',
          '--output=html', '--output=json', `--output-path=${output}`,
          '--chrome-flags=--headless --disable-extensions --no-first-run', '--quiet',
          ...(device === 'desktop' ? ['--preset=desktop'] : []),
        ], { stdio: 'inherit', windowsHide: true })
        child.once('error', reject)
        child.once('exit', (code) => code === 0 ? done() : reject(new Error(`Lighthouse terminou com código ${code}`)))
      })
      const report = JSON.parse(await readFile(`${output}.report.json`, 'utf8'))
      if (report.runtimeError) throw new Error(report.runtimeError.message)
      const result = {
        page: page.name, device, run, fetchedAt: report.fetchTime, lighthouseVersion: report.lighthouseVersion,
        scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
        metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((id) => [id, report.audits[id].numericValue])),
        warnings: report.runWarnings,
      }
      results.push(result)
      console.log(JSON.stringify(result))
      await writeFile(resolve(directory, 'summary.json'), JSON.stringify(results, null, 2) + '\n')
    }
  }
  }
} finally {
  await new Promise((done) => server.httpServer.close(done))
}
console.log(`Relatórios salvos em ${directory}`)

function deviceList() { return device === 'both' ? ['mobile', 'desktop'] : [device] }
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const medians = pages.flatMap((page) => deviceList().map((device) => {
  const entries = results.filter((entry) => entry.device === device && entry.page === page.name)
  return {
    page: page.name, device, runs: entries.length,
    scores: Object.fromEntries(Object.keys(entries[0].scores).map((key) => [key, median(entries.map((entry) => entry.scores[key]))])),
    metrics: Object.fromEntries(Object.keys(entries[0].metrics).map((key) => [key, median(entries.map((entry) => entry.metrics[key]))])),
  }
}))
await writeFile(resolve(directory, 'medians.json'), JSON.stringify(medians, null, 2) + '\n')
console.log('Medianas:', JSON.stringify(medians))
