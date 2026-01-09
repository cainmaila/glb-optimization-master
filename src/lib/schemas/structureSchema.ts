import { z } from 'zod'

/**
 * Zod schema for validating imported model structure JSON.
 * Matches the ExportNode interface.
 */
export const exportNodeSchema: z.ZodType<any> = z.lazy(() =>
	z.object({
		name: z.string(),
		path: z.string(),
		type: z.string(),
		size: z
			.object({
				x: z.number(),
				y: z.number(),
				z: z.number()
			})
			.nullable(),
		matrix: z.array(z.number()).length(16),
		children: z.array(exportNodeSchema)
	})
)

export type ExportNodeInputs = z.infer<typeof exportNodeSchema>
