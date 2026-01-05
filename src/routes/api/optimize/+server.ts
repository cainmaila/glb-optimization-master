import type { RequestHandler } from './$types';
import { optimizeGLB } from '$lib/utils/gltfTransform';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log(`Received file: ${file.name}, size: ${buffer.length} bytes`);

    const optimizedBuffer = await optimizeGLB(buffer);

    console.log(`Optimized size: ${optimizedBuffer.length} bytes`);

    return new Response(optimizedBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `attachment; filename="optimized_${file.name}"`,
      },
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return new Response('Optimization failed', { status: 500 });
  }
};
