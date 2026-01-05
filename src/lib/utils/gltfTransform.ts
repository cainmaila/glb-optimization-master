import { NodeIO, Document } from '@gltf-transform/core';
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

// Helper to generate simple report
function getReport(doc: Document, bufferSize: number) {
  const root = doc.getRoot();
  const meshes = root.listMeshes();
  const textures = root.listTextures();
  const materials = root.listMaterials();
  
  // Calculate approximate draw calls (sum of primitives)
  const drawCalls = meshes.reduce((acc, mesh) => acc + mesh.listPrimitives().length, 0);

  return {
    info: {
      totalSizeBytes: bufferSize,
      meshCount: meshes.length,
      drawCalls: drawCalls,
      textureCount: textures.length,
      materialCount: materials.length
    }
  };
}

export async function optimizeGLB(buffer: Uint8Array, config: OptimizationConfig) {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRMeshQuantization, EXTMeshoptCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });

  const document = await io.readBinary(buffer);

  // Generate report for original model
  const originalReport = getReport(document, buffer.length);

  // Build transform pipeline based on config
  const transforms = [];

  // Cleanup
  if (config.prune) transforms.push(prune());
  if (config.dedup) transforms.push(dedup());
  
  // Geometry
  if (config.instance) transforms.push(instance());
  if (config.join) transforms.push(join()); // Conditionally join meshes
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
      // Default to jpeg if resizing is active and no specific format chosen
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
  
  // Generate report for optimized model
  const optimizedReport = getReport(document, optimizedBuffer.length);

  return {
    buffer: optimizedBuffer,
    originalReport,
    optimizedReport
  };
}
