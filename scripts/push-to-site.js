#!/usr/bin/env node

/*
 * Mirrors changelog.csv into the motion.dev site source so the public
 * changelog at motion.dev/changelog stays in sync with this repo. The site
 * ingests this file as the "Motion AI Kit" library (the filename is
 * historical — the Studio era lives in the same lineage).
 *
 * Set MOTION_API_PATH to override the destination repo location.
 */

const fs = require("fs")
const path = require("path")
const os = require("os")

const LIBRARY_FILENAME = "studio.csv"

function pushToSite() {
    const csvPath = path.join(__dirname, "..", "changelog.csv")
    if (!fs.existsSync(csvPath)) {
        console.error(`changelog.csv not found at ${csvPath} — run scripts/generate-changelog-csv.js first`)
        process.exit(1)
    }

    const motionApiPath =
        process.env.MOTION_API_PATH || path.join(os.homedir(), "Sites", "motion-api")
    const destDir = path.join(
        motionApiPath,
        "packages",
        "site",
        "app",
        "content",
        "changelog"
    )

    if (!fs.existsSync(destDir)) {
        console.error(`Destination not found: ${destDir}`)
        console.error(
            `Set MOTION_API_PATH if motion-api is checked out elsewhere.`
        )
        process.exit(1)
    }

    const destPath = path.join(destDir, LIBRARY_FILENAME)
    fs.copyFileSync(csvPath, destPath)

    const bytes = fs.statSync(destPath).size
    console.log(`Mirrored changelog.csv → ${destPath} (${bytes} bytes)`)
    console.log(
        `Commit and push motion-api to deploy the updated changelog at motion.dev/changelog.`
    )
}

if (require.main === module) {
    pushToSite()
}

module.exports = { pushToSite }
