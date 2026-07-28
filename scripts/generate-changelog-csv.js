#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

/*
 * Converts the root CHANGELOG.md into changelog.csv for motion.dev.
 *
 * Slugs are URL fragments on motion.dev/changelog, so they must stay stable:
 * entries from the Studio era (below 7.0.0) keep their historical "studio-"
 * prefix, and AI Kit releases (7.0.0 up) use "ai-kit-".
 */

const AI_KIT_MAJOR = 7

function majorOf(version) {
    return Number(version.replace(/[\[\]]/g, "").split(".")[0])
}

/**
 * Generate a slug from version number by replacing dots with dashes and
 * removing leading and trailing zeros, e.g. "7.0.0" -> "ai-kit-7",
 * "6.2.0" -> "studio-6-2".
 */
function generateSlug(version) {
    const prefix = majorOf(version) >= AI_KIT_MAJOR ? "ai-kit" : "studio"
    const cleanVersion = version.replace(/[\[\]]/g, "")
    const parts = cleanVersion.split(".")

    const cleanedParts = parts.map((part) => String(Number(part)))

    while (
        cleanedParts.length > 1 &&
        cleanedParts[cleanedParts.length - 1] === "0"
    ) {
        cleanedParts.pop()
    }

    return prefix + "-" + cleanedParts.join("-")
}

/**
 * Parse version string to determine if it's major, minor, or patch
 * Based on semantic versioning (x.y.z)
 */
function getVersionType(version) {
    const cleanVersion = version.replace(/[\[\]]/g, "")
    const parts = cleanVersion.split(".")

    if (parts.length >= 3) {
        const [, minor, patch] = parts.map(Number)
        if (patch > 0) return "patch"
        if (minor > 0) return "minor"
        return "major"
    }

    return "patch"
}

/**
 * Escape CSV field - handle quotes and commas
 */
function escapeCsvField(field) {
    if (field.includes('"') || field.includes(",") || field.includes("\n")) {
        return '"' + field.replace(/"/g, '""') + '"'
    }
    return field
}

/**
 * Parse the changelog file and return entries
 */
function parseChangelogFile(changelogPath) {
    const content = fs.readFileSync(changelogPath, "utf8")
    const lines = content.split("\n")

    const entries = []
    let currentEntry = null
    let currentContent = []
    let inContentSection = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Check if this is a version header (## [version] date)
        const versionMatch = line.match(/^## \[([^\]]+)\] (.+)$/)
        if (versionMatch) {
            if (currentEntry) {
                currentEntry.content = currentContent.join("\n").trim()
                entries.push(currentEntry)
            }

            const version = versionMatch[1]
            const date = versionMatch[2]

            currentEntry = {
                version,
                date,
                content: "",
                type: getVersionType(version),
                slug: generateSlug(version),
                library: majorOf(version) >= AI_KIT_MAJOR ? "AI Kit" : "Studio",
            }
            currentContent = []
            inContentSection = false
            continue
        }

        // Skip the changelog header and intro
        if (!currentEntry) {
            continue
        }

        // Check if we're starting a content section (### Added, ### Fixed, etc.)
        if (line.match(/^### /)) {
            inContentSection = true
            currentContent.push(line)
            continue
        }

        if (inContentSection) {
            currentContent.push(line)
        }
    }

    if (currentEntry) {
        currentEntry.content = currentContent.join("\n").trim()
        entries.push(currentEntry)
    }

    return entries
}

/**
 * Parse the changelog and convert to CSV
 */
function parseChangelog() {
    const csvPath = path.join(__dirname, "..", "changelog.csv")
    const changelogPath = path.join(__dirname, "..", "CHANGELOG.md")

    try {
        if (!fs.existsSync(changelogPath)) {
            throw new Error(`CHANGELOG.md not found at ${changelogPath}`)
        }
        const allEntries = parseChangelogFile(changelogPath)
        console.log(`📦 Processed ${allEntries.length} entries`)

        // Sort entries by date (newest first) - assuming date format is YYYY-MM-DD
        allEntries.sort((a, b) => {
            return new Date(b.date) - new Date(a.date)
        })

        const csvHeaders = "version,date,content,type,slug,library\n"
        const csvRows = allEntries
            .map((entry) => {
                return [
                    escapeCsvField(entry.version),
                    escapeCsvField(entry.date),
                    escapeCsvField(entry.content),
                    escapeCsvField(entry.type),
                    escapeCsvField(entry.slug),
                    escapeCsvField(entry.library),
                ].join(",")
            })
            .join("\n")

        fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf8")

        console.log(`✅ Successfully converted CHANGELOG.md to CSV`)
        console.log(`📁 Output: ${csvPath}`)
        console.log(`📊 Total entries: ${allEntries.length}`)
    } catch (error) {
        console.error("❌ Error processing changelog:", error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    parseChangelog()
}

module.exports = { parseChangelog }
