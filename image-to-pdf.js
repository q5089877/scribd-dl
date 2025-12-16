import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { pdfGenerator } from "./src/utils/io/PdfGenerator.js"
import { Image } from "./src/object/Image.js"

const run = async () => {
    if (process.argv.length < 3) {
        console.error("Usage: node image-to-pdf.js <directory>")
        process.exit(1)
    }

    const dir = process.argv[2]
    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`)
        process.exit(1)
    }

    // Get all images
    const files = fs.readdirSync(dir).filter(file => file.match(/\.(png|jpg|jpeg)$/i))
    if (files.length === 0) {
        console.error(`No images found in ${dir}`)
        process.exit(1)
    }

    // Sort by number in filename
    files.sort((a, b) => {
        const matchA = a.match(/\d+/)
        const matchB = b.match(/\d+/)
        const nA = matchA ? parseInt(matchA[0]) : 0
        const nB = matchB ? parseInt(matchB[0]) : 0
        if (nA !== nB) return nA - nB
        return a.localeCompare(b)
    })

    console.log(`Found ${files.length} images.`)

    // Prepare Image objects
    const images = []
    for (const file of files) {
        const filePath = path.join(dir, file)
        try {
            const metadata = await sharp(filePath).metadata()
            images.push(new Image(
                filePath,
                metadata.width,
                metadata.height
            ))
            process.stdout.write(`\rLoaded metadata: ${images.length}/${files.length}`)
        } catch (error) {
            console.error(`\nFailed to load ${file}: ${error.message}`)
        }
    }
    console.log("")

    // Generate PDF
    const cleanDir = dir.replace(/[\\/]$/, '')
    const output = `${path.resolve(cleanDir)}.pdf`

    console.log(`Generating PDF: ${output}`)
    await pdfGenerator.generate(images, output)
}

await run()
