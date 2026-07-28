#!/usr/bin/env node

/*
 * Copies the AI Kit content out of plugins/motion into this package's
 * content/ directory so it ships inside the npm tarball. plugins/motion is
 * the single source of truth — shared with the Cursor marketplace plugin —
 * and content/ is generated, gitignored and rebuilt on every build.
 */

import { cpSync, existsSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const pluginRoot = join(pkgRoot, "..", "..", "plugins", "motion")
const contentDir = join(pkgRoot, "content")

if (!existsSync(pluginRoot)) {
    console.error(`plugins/motion not found at ${pluginRoot}`)
    process.exit(1)
}

rmSync(contentDir, { recursive: true, force: true })
for (const dir of ["skills", "rules", "agents"]) {
    const src = join(pluginRoot, dir)
    if (existsSync(src)) cpSync(src, join(contentDir, dir), { recursive: true })
}
console.log(`Synced plugins/motion content into ${contentDir}`)
