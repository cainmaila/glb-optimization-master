import { NodeIO } from '@gltf-transform/core';
import {
  draco,
  prune,
  dedup,
  instance,
  quantize,
  join,
  resample,
  textureCompress,
  meshopt
} from '@gltf-transform/functions';
import { KHRDracoMeshCompression, KHRMeshQuantization, EXTMeshoptCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import type { OptimizationConfig } from '../settings';

import sharp from 'sharp';

export async function optimizeGLB(buffer: Uint8Array, config: OptimizationConfig): Promise<Uint8Array> {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRMeshQuantization, EXTMeshoptCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });

  const document = await io.readBinary(buffer);

  // Build transform pipeline based on config
  const transforms = [];

  // Cleanup
  if (config.prune) transforms.push(prune());
  if (config.dedup) transforms.push(dedup());
  
  // Geometry
  if (config.instance) transforms.push(instance());
  transforms.push(join()); // General optimization, usually safe to keep
  transforms.push(resample());
  
  if (config.quantize) {
    transforms.push(quantize({
      pattern: /^(POSITION|NORMAL|TANGENT)$/,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeColor: 8,
      quantizeTexcoord: 12
    }));
  }
  
  // Texture Optimization
  if (config.maxTextureSize < 4096 || config.textureFormat === 'webp') {
    const textureOptions: any = {
      encoder: sharp,
      resize: config.maxTextureSize < 4096 ? [config.maxTextureSize, config.maxTextureSize] : undefined,
    };

    if (config.textureFormat === 'webp') {
      textureOptions.targetFormat = 'webp';
      textureOptions.formats = /.*/; // Convert common formats to WebP
    } else {
      // If staying original but resizing, we generally default to a safe efficient format like JPEG 
      // or rely on the tool's behavior. For this simple implementation, if resizing is requested
      // without format change, we'll try to keep it simple. 
      // Note: gltf-transform textureCompress usually requires a targetFormat or defaults to something.
      // We will perform a specific resize-only pass if needed, or default to JPEG for compression gain.
      // For now, let's default to jpeg if resizing is active and no specific format chosen,
      // as it offers better compression than PNG for general 3D assets.
      textureOptions.targetFormat = 'jpeg';
      textureOptions.formats = /image\/(jpeg|png)/;
    }

    transforms.push(textureCompress(textureOptions));
  }
  
  if (config.draco) {
    transforms.push(draco({
      method: 'edgebreaker',
      quantizationVolume: 'mesh'
    }));
  }

  if (config.meshopt) {
    transforms.push(meshopt({
      encoder: MeshoptEncoder,
      level: 'medium'
    }));
  }

  // Apply all transforms
  await document.transform(...transforms);

  const optimizedBuffer = await io.writeBinary(document);
  return optimizedBuffer;
}
