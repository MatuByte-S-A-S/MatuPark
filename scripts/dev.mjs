/**
 * Arranca Vite + API de facturación en paralelo.
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(name, cmd, args) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) process.exit(code)
  })
  return child
}

run('billing', 'node', ['server/billing-api.mjs'])
run('vite', 'npx', ['vite'])

process.on('SIGINT', () => process.exit(0))
