---
title: Building a Reflective Helmet Overlay with Vision Camera v5 and React Native Skia
date: 2025-06-23
excerpt: How we wired a multi-camera session, GPU frame import, and Skia shaders into a face-tracked reflective helmet overlay in React Native.
---

Multi-camera on mobile sounds simple until you try to render one camera inside a Skia shader on another camera's preview. This post walks through a real implementation: a multi-cam test screen in a React Native driver app where the front camera drives face tracking, a back-camera feed reflects inside a helmet-shaped overlay, and everything stays on the GPU as long as possible.

The stack: **react-native-vision-camera v5** (imperative `CameraSession` API), **@shopify/react-native-skia** for the overlay, **react-native-vision-camera-face-detector** for landmarks, and **react-native-reanimated** SharedValues to bridge camera worklets to the UI thread.

## The goal

We wanted a test harness—not production polish yet—with these behaviors:

- Run front + back cameras in one multi-cam session.
- Detect the face on the primary camera and draw a helmet oval on the user's head.
- Fill that oval with a distorted reflection of the other camera (PiP shows the raw secondary feed; the helmet shows the same feed through a dome shader).
- Swap which camera is primary without tearing down the session.

Mission List → filter icon opens the screen. A footer shows debug state: face pose, reflection import status, frame counts.

## Multi-cam session layout

Vision Camera v5 multi-cam uses an imperative session. Each physical camera can attach up to two outputs in our setup:

| Camera | Output 1 | Output 2 |
|--------|----------|----------|
| Primary | Preview | Face detector |
| Secondary | Preview (PiP) | Reflection frame output |

Primary starts as front (selfie + face landmarks). The back camera feeds the reflection.

```ts
export const multiCamReflectionFrameOutputOptions = {
  pixelFormat: 'rgb' as const,
  enablePreviewSizedOutputBuffers: true,
  enablePhysicalBufferRotation: true,
  allowDeferredStart: false,
  dropFramesWhileBusy: false,
};
```

We switched reflection frames from `'native'` to `'rgb'` after Skia imports succeeded but drew black textures—native/YUV buffers are zero-copy on the GPU, but Skia's `Image` sampling path was more reliable with BGRA RGB frames for this overlay.

Session connections are rebuilt when the user taps **Swap**, flipping which camera is primary vs reflection source:

```ts
await session.configure(
  buildMultiCamSessionConnections(
    devices,
    previewOutputs,
    primaryCamera,
    { front: frontFaceOutput, back: backFaceOutput },
    { front: frontReflectionFrameOutput, back: backReflectionFrameOutput },
  ),
);
```

Face detection callbacks check `primaryCameraRef.current` so only the active primary camera updates helmet pose.

## Face → helmet pose

Landmarks from the face detector (`LEFT_EYE`, `RIGHT_EYE`, `NOSE_BASE`, optional ears) are converted to a screen-space helmet pose: center, width, height, roll. Pose updates are quantized (4 px grid, roll rounded) and throttled (~100 ms) to avoid layout thrashing.

The overlay is a local absolutely positioned `View` sized to the helmet ellipse—not a full-screen Canvas—so Skia only repaints a small region.

## GPU reflection pipeline

The reflection path deliberately avoids JPEG/base64 in the hot loop.

### 1. Frame output on the secondary camera

A `useFrameOutput` worklet receives frames from the non-primary camera:

```ts
const backReflectionFrameOutput = useFrameOutput({
  ...multiCamReflectionFrameOutputOptions,
  onFrame: frame => {
    'worklet';
    processMultiCamGpuReflectionFrame(frame, 'back', primaryCameraShared);
  },
});
```

### 2. Import via Skia on the camera worklet

```ts
export function processMultiCamGpuReflectionFrame(
  frame: Frame,
  cameraPosition: MultiCamCameraPosition,
  primaryCamera: SharedValue<MultiCamCameraPosition>,
) {
  'worklet';
  if (primaryCamera.value === cameraPosition) {
    frame.dispose();
    return;
  }
  if (!shouldProcessGpuReflectionFrame()) {
    frame.dispose();
    return;
  }
  const nativeBuffer = frame.getNativeBuffer();
  let nextImage: SkImage | null = null;
  try {
    nextImage = Skia.Image.MakeImageFromNativeBuffer(nativeBuffer.pointer);
  } finally {
    nativeBuffer.release();
    frame.dispose();
  }
  if (nextImage != null) {
    publishReflectionImage(nextImage, mirror, sourceLabel, stats);
  }
}
```

**Important:** pass `nativeBuffer.pointer` (a bigint), not the whole `NativeBuffer` object. Skia's native binding expects the retained `CVPixelBuffer` / `AHardwareBuffer` pointer.

Imports are throttled (~500 ms) so we do not flood `scheduleOnRN` on every frame.

### 3. Bridge to React Native and UI thread

Camera worklets cannot call Reanimated's `runOnUI` directly (Vision Camera's frame runtime ≠ Reanimated UI runtime). Pattern:

- Camera worklet → `scheduleOnRN(deliverReflectionImageFromWorklet, skImage, …)`
- RN thread → `runOnUI` to assign SharedValues + `notifyChange`
- RN thread → React state for "reflection ready" debug footer

```ts
runOnUI(() => {
  'worklet';
  let canvasImage = copyReflectionImageToUiSurface(nextImage);
  const previousImage = reflectionImage.value;
  reflectionImage.value = canvasImage;
  reflectionMirror.value = mirror;
  if (previousImage != null) {
    previousImage.dispose();
  }
  notifyChange(reflectionImage);
  notifyChange(reflectionMirror);
  scheduleOnRN(noteReflectionImageReadyFromWorklet, /* stats */);
})();
```

### 4. Why `makeNonTextureImage()` was removed

Early versions called `makeNonTextureImage()` on the JS thread to "safely" copy the GPU texture. On iOS this often produced a valid 480×640 image that was entirely black—Skia's docs note GPU readback can fail silently. The footer still showed `refl GPU OK`, but the overlay showed a blue fallback or a black oval.

**Fix:** keep the GPU-backed `SkImage`, then blit to an offscreen Skia surface on the UI thread so the Canvas reads from its own `GrContext`:

```ts
function copyReflectionImageToUiSurface(source: SkImage): SkImage {
  'worklet';
  const surface = Skia.Surface.MakeOffscreen(source.width(), source.height());
  if (surface == null) {
    return source;
  }
  surface.getCanvas().drawImage(source, 0, 0);
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  source.dispose();
  return snapshot;
}
```

## Skia overlay: clip, transform, and shaders

The helmet is drawn in a Canvas clipped to an SVG ellipse path. Two common bugs we hit:

### Clip and transform on the same Group

Skia applies clip before transform on a `Group`. Putting both on one node clipped the oval at the top-left of the helmet view—a tiny grey blob in the corner of a black circle.

**Fix:** outer `Group` for translate + rotate, inner `Group` for clip.

```tsx
<Group transform={[{ translateX: localCx }, { translateY: localCy }, { rotate: roll }]}>
  <Group clip={clipPath}>
    {/* reflection + lighting */}
  </Group>
</Group>
```

### Reanimated `useDerivedValue` vs Skia `notifyChange`

We initially toggled reflection opacity with:

```ts
const reflectionOpacity = useDerivedValue(() =>
  reflectionImage.value != null ? 1 : 0,
);
```

The GPU bridge reported success, but the overlay stayed on the blue fallback. Reanimated derived values do not call Skia's `notifyChange`. Skia only redraws SharedValues it tracks when `notifyChange(sharedValue)` runs on the same value passed to `<Image image={reflectionImage} />`.

**Fix:** drive visibility with React state (`reflectionReady`) set from the bridge after UI-thread assignment, and always call `notifyChange(reflectionImage)` when swapping textures.

## The dome reflection shader

We use a `RuntimeEffect` that samples an `ImageShader` child as `envMap`: flat UVs for the base feed, dome-mapped UVs for reflection, fresnel rim, and specular highlight.

```glsl
half4 main(float2 xy) {
  float2 local = xy - uCenter;
  float nx = local.x / uRadiusX;
  float ny = local.y / uRadiusY;
  float r2 = nx * nx + ny * ny;
  if (r2 > 1.0) return half4(0.0);
  float z = sqrt(max(0.0, 1.0 - r2));
  float3 N = normalize(float3(nx, ny, z));
  float2 baseUV = float2(nx * 0.5 + 0.5, ny * 0.5 + 0.5);
  float2 reflUV = /* dome mapping from reflect vector */;
  half4 base = envMap.eval(baseUV);
  half4 refl = envMap.eval(reflUV);
  float fresnel = pow(1.0 - z, 2.6);
  half3 color = mix(base.rgb, refl.rgb, 0.18 + fresnel * 0.62);
  // specular + rim tint ...
  return half4(color, edge);
}
```

The overlay stacks:

1. Base `Image` with `fit="cover"` (proves the feed is visible)
2. `HELMET_REFLECTION_SHADER` on the same oval (dome distortion)
3. `HELMET_LIGHTING_SHADER` with `blendMode="screen"` (specular band)
4. Stroke + highlight ovals for a visor chrome look

Mirror the reflection group with `{ scaleX: -1 }` when the source is the front camera.

## Debug footer as a lifeline

When GPU import "works" but nothing shows, the UI lies less than logs if you surface state:

```ts
export function formatReflectionDebug(debug: ReflectionDebugState): string {
  if (debug.encodeOk > 0 && debug.lastImageSize != null) {
    return `refl GPU OK ${debug.lastImageSize} (n=${debug.encodeOk})`;
  }
  if (debug.importFailed > 0) {
    return `refl GPU fail (${debug.importFailed}): ${debug.lastError}`;
  }
  // waiting / throttling / primary-only frames ...
}
```

`refl GPU OK 480x640 (n=40)` with a black helmet meant import succeeded, sampling failed—not a camera permission issue.

## Flickering and trade-offs

To force Canvas updates we briefly used `key={reflectionFrameKey}` on `<Canvas>`, remounting Skia every reflection frame. That fixed stale textures but caused visible flicker. Mitigations we explored (and you may want to keep):

- Remove Canvas `key`; rely on `notifyChange` only
- Set `reflectionReady` once via a ref, not every frame
- Defer disposing the previous `SkImage` until the next frame lands
- Reuse one offscreen blit surface instead of allocating per frame
- Throttle reflection updates (500 ms–1 s)

There is an inherent tension: hard texture swaps at 2 Hz look like flicker even without remounts. Production would need crossfade or a single updating GPU texture without snapshot copies.

## Architecture sketch

```
┌─────────────────────────────────────────────────────────┐
│ MultiCamTestScreen                                       │
│  ├─ NativePreviewView (primary + PiP)                   │
│  ├─ MultiCamHelmetOverlay (Skia Canvas, local View)     │
│  └─ MultiCamTestFooter (pose + reflection debug)        │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ helmetPose (React state)     │ reflectionImage (SharedValue)
         │                              │
┌────────┴────────┐          ┌─────────┴──────────────────┐
│ Face detector   │          │ useMultiCamHelmetBridge     │
│ (primary cam)   │          │  + reflectionBridge handlers│
└─────────────────┘          └─────────▲──────────────────┘
                                         │
                              scheduleOnRN → runOnUI
                                         │
                              ┌──────────┴──────────┐
                              │ Camera frame worklet │
                              │ MakeImageFromNative  │
                              │ Buffer + throttle    │
                              └─────────────────────┘
```

## Lessons learned

- Zero-copy native buffers are correct for performance, but your display path must match—RGB conversion was worth it for Skia `Image`/`ImageShader` reliability here.
- `notifyChange` is not optional when driving Skia from Reanimated SharedValues.
- Never trust `makeNonTextureImage()` for live camera textures without verifying pixels on device.
- Separate clip and transform groups in Skia; order matters.
- Debug UI that distinguishes import vs render saves hours when the footer says OK and the shader shows black.
- Do not remount `<Canvas>` to refresh dynamic GPU images—fix the SharedValue subscription instead.

## What's next

This screen is a test bed. Production would add: smoother pose interpolation, swap without full session reconfigure if the API allows, a single-shader path once the feed is stable, and device-specific format negotiation (stay on native where Skia samples YUV correctly).

If you are building something similar—AR overlays, dual-camera effects, or GPU-only pipelines in React Native—the boring glue (thread bridges, retain/release of `NativeBuffer`, and Skia redraw signals) matters as much as the shader math.

---

*Ivan Syniuk — React Native, 6 years. This post is based on multi-cam helmet overlay work in the otoqi driver mobile app.*
