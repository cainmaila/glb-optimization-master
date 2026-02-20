#!/usr/bin/env node
/**
 * GLB Optimization Sidecar Script
 *
 * Usage: node optimize-glb.js <inputPath> <configJson> <outputPath>
 *
 * Reads a GLB file from `inputPath`, applies the optimizations described in
 * `configJson`, writes the result to `outputPath`, and prints a JSON report
 * to stdout.
 *
 * This script is bundled as a Tauri resource and invoked by the Rust backend.
 * It relies on the project's node_modules for its dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve node_modules relative to this script's location.
// In development the sidecar lives in src-tauri/sidecar/ so we walk up two
// levels to reach the project root's node_modules.
const MAX_PARENT_DIRS = 6; // enough to cover reasonable monorepo nesting depths

function resolveModule(name) {
  // Try standard resolution first (works when node_modules is in PATH)
  try {
    return require.resolve(name);
  } catch (_) {}

  // Walk up from __dirname to find node_modules
  let dir = __dirname;
  for (let i = 0; i < MAX_PARENT_DIRS; i++) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Cannot find module '${name}'`);
}

async function main() {
  const [, , inputPath, configJson, outputPath] = process.argv;

  if (!inputPath || !configJson || !outputPath) {
    process.stderr.write(
      'Usage: node optimize-glb.js <inputPath> <configJson> <outputPath>\n'
    );
    process.exit(1);
  }

  const config = JSON.parse(configJson);

  // Dynamically require dependencies so that the module resolution uses
  // the project's node_modules regardless of the current working directory.
  const { NodeIO } = require(resolveModule('@gltf-transform/core'));
  const {
    KHRDracoMeshCompression,
    KHRMeshQuantization,
    EXTMeshoptCompression,
  } = require(resolveModule('@gltf-transform/extensions'));
  const {
    draco,
    prune,
    dedup,
    instance,
    quantize,
    join,
    resample,
    textureCompress,
    meshopt,
  } = require(resolveModule('@gltf-transform/functions'));
  const draco3d = require(resolveModule('draco3d'));
  const { MeshoptDecoder, MeshoptEncoder } = require(resolveModule('meshoptimizer'));
  const sharp = require(resolveModule('sharp'));

  // --- Read input ---
  const inputBuffer = new Uint8Array(fs.readFileSync(inputPath));

  // --- Set up gltf-transform IO ---
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRMeshQuantization, EXTMeshoptCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });

  const document = await io.readBinary(inputBuffer);

  // --- Report helper ---
  function getReport(doc, bufferSize) {
    const root = doc.getRoot();
    const meshes = root.listMeshes();
    const textures = root.listTextures();
    const materials = root.listMaterials();
    const drawCalls = meshes.reduce((acc, mesh) => acc + mesh.listPrimitives().length, 0);
    return {
      info: {
        totalSizeBytes: bufferSize,
        meshCount: meshes.length,
        drawCalls,
        textureCount: textures.length,
        materialCount: materials.length,
      },
    };
  }

  const originalReport = getReport(document, inputBuffer.length);

  // --- Build transform pipeline ---
  const transforms = [];

  if (config.prune) transforms.push(prune());
  if (config.dedup) transforms.push(dedup());
  if (config.instance) transforms.push(instance());
  if (config.join) transforms.push(join());
  transforms.push(resample());

  if (config.quantize) {
    transforms.push(
      quantize({
        pattern: /^(POSITION|NORMAL|TANGENT)$/,
        quantizePosition: 14,
        quantizeNormal: 10,
        quantizeColor: 8,
        quantizeTexcoord: 12,
      })
    );
  }

  if (config.maxTextureSize < 4096 || config.textureFormat === 'webp') {
    const textureOptions = {
      encoder: sharp,
      resize:
        config.maxTextureSize < 4096
          ? [config.maxTextureSize, config.maxTextureSize]
          : undefined,
    };

    if (config.textureFormat === 'webp') {
      textureOptions.targetFormat = 'webp';
      textureOptions.formats = /.*/;
    } else {
      textureOptions.targetFormat = 'jpeg';
      textureOptions.formats = /image\/(jpeg|png)/;
    }

    transforms.push(textureCompress(textureOptions));
  }

  if (config.draco) {
    transforms.push(
      draco({ method: 'edgebreaker', quantizationVolume: 'mesh' })
    );
  }

  if (config.meshopt) {
    transforms.push(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  }

  await document.transform(...transforms);

  // --- Write output ---
  const optimizedBuffer = await io.writeBinary(document);
  fs.writeFileSync(outputPath, Buffer.from(optimizedBuffer));

  const optimizedReport = getReport(document, optimizedBuffer.length);

  // Print JSON result to stdout for the Rust command to parse
  process.stdout.write(
    JSON.stringify({
      outputPath,
      originalReport,
      optimizedReport,
    })
  );
}

main().catch((err) => {
  process.stderr.write(String(err.stack || err) + '\n');
  process.exit(1);
});
