import type { RequestHandler } from './$types'
import { optimizeGLB } from '$lib/utils/gltfTransform'
import { defaultSettings } from '$lib/settings'

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as File
		const configStr = formData.get('config') as string

		const config = configStr ? JSON.parse(configStr) : defaultSettings

		if (!file) {
			return new Response('No file provided', { status: 400 })
		}

		const arrayBuffer = await file.arrayBuffer()
		const buffer = new Uint8Array(arrayBuffer)

		console.log(`Received file: ${file.name}, size: ${buffer.length} bytes`)
		console.log(`Config:`, config)

		const {
			buffer: optimizedBuffer,
			originalReport,
			optimizedReport
		} = await optimizeGLB(buffer, config)

		console.log(`Optimized size: ${optimizedBuffer.length} bytes`)

		// Convert to Base64
		const base64File = Buffer.from(optimizedBuffer).toString('base64')

		return new Response(
			JSON.stringify({
				file: base64File,
				originalReport,
				optimizedReport
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		console.error('Optimization error:', error)
		return new Response('Optimization failed', { status: 500 })
	}
}
