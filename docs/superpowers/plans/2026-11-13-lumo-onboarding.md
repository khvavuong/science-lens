# Lumo Onboarding Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation.

**Goal:** Turn first launch into the approved Lumo-led three-step introduction.
**Architecture:** Keep first-launch routing and persistence in Home. Render the current step, local illustration, progress and controls in WelcomeScreen.
**Tech Stack:** Expo 58, React Native, expo-image and AsyncStorage.
**Spec:** [Onboarding LumosLens với Lumo](../specs/2026-11-13-lumo-onboarding-design.md)

## Global Constraints

Vietnamese, portrait, cream background and brand-blue CTA. Reuse the exact cyan wardrobe asset and existing apple image. No dependency or backend changes.

## Review Focus

Exercise new and returning users, all skip actions, backward navigation, camera permission fallback, and layout at small and enlarged text sizes.

## Task 1: Three-step onboarding

- [x] Verify the current welcome screen fails the three-step browser scenario.
- [x] Bundle the wardrobe WebP and render approved copy and visual for each step in `WelcomeScreen.tsx`. Reuse the shared trail and buttons.
- [x] Keep existing persistence and scan routing. Synchronize `DESIGN.md` and mark the spec approved.
- [x] Verify first launch, both exits, persistence, no backend access and small-screen rendering. Run app typecheck, lint, Expo Doctor and Android export, plus server typecheck.
- [x] Capture the three screens from the running web app for review.
