#!/usr/bin/env node
/**
 * Ollama lifecycle helpers — free RAM when not testing AI.
 * Usage: node src/scripts/ollama-lifecycle.mjs unload|quit|start|pull-fast
 */
import { spawnSync, execSync } from 'node:child_process'
import { platform } from 'node:os'

const cmd = process.argv[2] || 'help'

function run(command, args = [], opts = {}) {
  const r = spawnSync(command, args, {
    stdio: 'inherit',
    shell: platform() === 'win32',
    ...opts,
  })
  return r.status ?? 1
}

function ollamaAvailable() {
  const r = spawnSync('ollama', ['--version'], { shell: true, encoding: 'utf8' })
  return r.status === 0
}

function unloadModels() {
  if (!ollamaAvailable()) {
    console.log('Ollama CLI not found — nothing to unload.')
    return 0
  }
  let psOut = ''
  try {
    psOut = execSync('ollama ps', { encoding: 'utf8', shell: true })
  } catch {
    console.log('No models loaded (or Ollama not running).')
    return 0
  }
  const names = psOut
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter((n) => n && n !== 'NAME')
  if (!names.length) {
    console.log('No models in memory.')
    return 0
  }
  for (const name of names) {
    console.log(`Stopping model: ${name}`)
    run('ollama', ['stop', name])
  }
  console.log('Models unloaded — RAM should drop.')
  return 0
}

function quitOllama() {
  unloadModels()
  const os = platform()
  if (os === 'darwin') {
    run('pkill', ['-x', 'ollama'])
    try {
      execSync('osascript -e \'quit app "Ollama"\'', { stdio: 'ignore' })
    } catch {
      /* app may already be quit */
    }
    console.log('Ollama quit (macOS).')
    return 0
  }
  if (os === 'win32') {
    run('taskkill', ['/IM', 'ollama.exe', '/F'])
    console.log('Ollama stopped (Windows).')
    return 0
  }
  run('pkill', ['-f', 'ollama'])
  console.log('Sent stop signal to ollama processes.')
  return 0
}

function startOllama() {
  const os = platform()
  if (os === 'darwin') {
    try {
      execSync('open -a Ollama', { stdio: 'ignore' })
      console.log('Starting Ollama app… wait ~5s then run: npm run test:ollama')
      return 0
    } catch {
      console.error('Could not open Ollama. Install from https://ollama.com')
      return 1
    }
  }
  if (os === 'win32') {
    console.log('Open the Ollama app from the Start menu, then run: npm run test:ollama')
    return 0
  }
  console.log('Run: ollama serve')
  return run('ollama', ['serve'])
}

function pullFast() {
  if (!ollamaAvailable()) {
    console.error('Install Ollama first: https://ollama.com')
    return 1
  }
  console.log('Pulling llama3.2:3b (fast default for BENZI)…')
  const code = run('ollama', ['pull', 'llama3.2:3b'])
  if (code === 0) {
    console.log('\nAdd to benzi-server/.env:')
    console.log('  LLM_PROVIDER=ollama')
    console.log('  OLLAMA_MODEL=llama3.2:3b')
    console.log('  OLLAMA_NUM_CTX=2048')
    console.log('\nSee docs/OLLAMA_HARDWARE.md')
  }
  return code
}

function help() {
  console.log(`
Ollama lifecycle (free RAM / start AI testing)

  npm run ollama:unload   Unload models from RAM (Ollama app can stay open)
  npm run ollama:quit     Quit Ollama completely (best when doing normal dev work)
  npm run ollama:start    Start Ollama app (macOS) / remind on Windows
  npm run ollama:pull-fast   Pull llama3.2:3b for fast local AI

Daily work without slowdown:
  1. npm run ollama:quit
  2. Optionally set LLM_PROVIDER=gemini in .env (cloud fallback, no local LLM)

When testing BENZI AI:
  1. npm run ollama:start
  2. Set LLM_PROVIDER=ollama in .env
  3. npm run test:ollama
  4. npm run ollama:unload when done
`)
  return 0
}

const handlers = { unload: unloadModels, quit: quitOllama, start: startOllama, 'pull-fast': pullFast, help }
const fn = handlers[cmd] || help
process.exit(fn())
