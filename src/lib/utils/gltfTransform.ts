import { NodeIO } from '@gltf-transform/core';
import {
  draco,
  prune,
  dedup,
  instance,
  quantize,
  join,
  resample
} from '@gltf-transform/functions';
import { KHRDracoMeshCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import draco3d from 'draco3d';

export async function optimizeGLB(buffer: Uint8Array): Promise<Uint8Array> {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRMeshQuantization])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  const document = await io.readBinary(buffer);

  await document.transform(
    // Remove unused nodes, textures, or other data.
    prune(),
    // Remove duplicate accessors, textures, or meshes.
    dedup(),
    // Join compatible primitives to reduce draw calls
    join(),
    // Instance compatible meshes
    instance(),
    // Resample animations
    resample(),
    
    // Quantize mesh geometry
    quantize({
      pattern: /^(POSITION|NORMAL|TANGENT)$/,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeColor: 8,
      quantizeTexcoord: 12
    }),
    
    // Draco compression
    draco({
      method: 'edgebreaker',
      quantizationVolume: 'mesh'
    })
  );

  const optimizedBuffer = await io.writeBinary(document);
  return optimizedBuffer;
}
