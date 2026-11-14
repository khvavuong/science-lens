# Lumo Pet style lock

Scope: this lock applies only to 2D Lumo Pet artwork and accessories worn by the pet. It does not apply to lesson scenes, scene components, 3D models, onboarding images, maps, or other lesson artwork. The map provenance below records the historical rendering reference; it does not expand this scope. The robot identity master controls the pet's identity.

Identity authority: robot-identity-master.png. The historical matte rendering reference is approved-map-baseline.png, approved on28 October2026; its source, checksum, dimensions, and earlier versions remain recorded in references.json. Preserve these bundled masters. Their provenance does not authorize work on maps or lesson assets.

## Canonical prompt block — use for pet artwork and wearables

> Lumo Pet style: gentle clean 2.5D mascot illustration, simple rounded silhouettes, broad smooth softly colored matte areas, diffuse daylight, restrained light-to-shadow range, minimal shallow shading, sparse small details, crisp readable silhouettes without blur. Preserve the pet's blue identity and meaningful accessory/accent colors. No paper/canvas grain, mottled overlay, haze, artificial sharpening halos, photoreal materials, glossy plastic, cinematic lighting, deep ambient occlusion, dark outlines, repeated speckled textures, fine decorative detail or neon saturation.

## Visual decisions

- **Forms:** preserve the pet's approved rounded anatomy and hardware. Simplify accessory folds and small details without changing their recognizable shape.
- **Detail hierarchy:** the pet's silhouette, eyes, and pose read first; wearable details support them.
- **Palette guides:** robot cyan, red scarf, and navy/gold regalia retain their semantic identity. Shadow areas stay colored and relatively light.
- **Light:** diffuse daytime, shallow soft shadows, no spotlight/rim light, no glossy white streaks. Glass may use one subtle light patch; avoid polished 3D reflections.
- **Clarity:** low contrast is not low opacity or haze. Keep the pet and its accessories readable at mobile size, with empty padding around cutouts.
- **Perspective:** use the pet's approved view; wearable layers match that view and their attachment position.
- **Materials:** softly painted/matte. Avoid cloth weave, stitching, and metal scratches unless the current pet brief makes them essential.
- **Background:** review boards may be white; runtime cutouts require verified transparency.

## Reference manifest

Read references.json to verify bundled masters and provenance. It identifies reference roles; it does not approve generated outputs. Never overwrite these reference files with a generated variant.

## Example delta after the shared block

Asset: one graduation cap wearable for Lumo Pet, reviewed at 48px.
Inputs: robot-identity-master.png = identity and fit authority; approved-map-baseline.png = historical matte rendering reference; existing cap image = shape only, unless explicitly approved.
Keep navy mortarboard, gold tassel, antenna clearance; simplify folds and highlights.
Single centered item, generous padding, transparent PNG with actual alpha.
Acceptance: clear tassel at 48px; no clipping, glossy lighting or neighboring objects; wearable alignment is a separate check.
