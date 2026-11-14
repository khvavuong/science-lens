---
name: lumos-asset-style
description: Use when creating, editing, or reviewing 2D artwork for Lumo Pet and its wearable accessories in LumosEdu. Does not apply to lesson scenes, scene components, 3D models, onboarding images, journey maps, or general lesson illustrations.
---

# Lumo Pet Asset Style

Create consistent 2D artwork for **Lumo Pet only**: the blue robot mascot, its expressions, poses, and accessories worn by that pet. This is an art-direction companion to the available image generator, not a generator or a UI implementation workflow.

## Scope

Apply this skill when Lumo Pet or its wearable artwork is the asset being created or reviewed. The presence of a pet beside lesson content does not bring the surrounding content into scope.

Do not use this skill for lesson scenes, scene components, environments, 3D models, onboarding images, journey maps, general reward icons, or lesson/Mentor illustrations. Those assets follow their own brief and workflow; they do not inherit the pet's rounded forms, palette, or surface treatment.

## References

- Inspect [robot-identity-master.png](references/robot-identity-master.png) and the [pet style lock](references/style-lock.md) before generating. The robot master controls anatomy, proportions, silhouette, recognizable colors, face, and hardware.
- Use the current brief for the requested pose, expression, accessory, framing, and display size. Do not redesign the pet's identity to match a new rendering style.
- The bundled map images and [reference manifest](references/references.json) remain historical references. The approved map baseline may inform the pet's matte rendering finish; it does not authorize map work or establish a style for lesson assets.
- Preserve the supplied masters. New candidates remain pending until the user approves them.

## Generation

Use the pet style block in the style lock, then append the asset-specific brief. Include:

1. The Lumo Pet pose, expression, or wearable and its intended display size.
2. Reference paths and their roles: identity, rendering finish, or accessory shape.
3. Allowed changes and identity or fit constraints to preserve.
4. Framing, file/background requirements, and acceptance checks.

Attach the robot identity master for character work and wearable-fit checks. A generic “cute/pastel robot” prompt is not equivalent.

| Asset | Preserve | Rendering |
|---|---|---|
| Lumo Pet | Blue head/body proportions, one ball antenna, two side pieces, two white eyes, mouthless face, limb count | Matte finish, shallow shading; mood through eyes and restrained posture |
| Pet wearable | Recognizable shape, wardrobe colors, attachment position, and antenna clearance | Few folds/buttons, clear silhouette, no microtexture |

Generate one final wearable per image call/file, with empty padding on every side. Cap and gown are separate assets. Do not simulate independent assets with atlas cropping. Transparent exports require real alpha. Verify alignment against the pet before claiming a wearable is equippable; a thumbnail alone does not establish fit.

## Review

Inspect each output at native size, at its intended display size, and beside the identity master and approved pet artwork. Check:

- Correct anatomy, proportions, recognizable colors, and accessory placement.
- Clear contours, restrained shading, and readable eyes and pose at mobile size.
- No clipping, neighboring-item fragments, fake transparency, or glossy plastic finish.
- Stable identity across poses; transparent wearable layers fit the pet.

Correct the source artwork rather than hiding drift with CSS blur, opacity, saturation, or contrast. Revise failed attributes and state what remains pending. Approval of one pet asset does not approve other assets or product UI.
