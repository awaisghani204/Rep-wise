/**
 * Inputs to Preview_Mapping: the preview view size and the upright camera frame size,
 * plus whether to mirror horizontally (true for the front camera).
 */
export interface MappingParams {
  /** Preview view width (dp). */
  viewWidth: number;
  /** Preview view height (dp). */
  viewHeight: number;
  /** Upright frame width (px), rotation already applied. */
  frameWidth: number;
  /** Upright frame height (px), rotation already applied. */
  frameHeight: number;
  /** True when the front camera is active, so x is reflected across the view. */
  mirrored: boolean;
}

/**
 * Maps a normalized landmark (0..1 of the upright frame) to preview coordinates,
 * matching `resizeMode="cover"`: uniform aspect-fill scale, centered crop, and
 * optional horizontal mirroring (`viewWidth - x`). Values outside 0..1 are not clamped.
 *
 * Precondition: `frameWidth > 0` and `frameHeight > 0` (callers such as
 * `buildSkeleton` check this before calling).
 */
export function mapPoint(nx: number, ny: number, p: MappingParams): { x: number; y: number } {
  const scale = Math.max(p.viewWidth / p.frameWidth, p.viewHeight / p.frameHeight);
  const scaledW = p.frameWidth * scale;
  const scaledH = p.frameHeight * scale;
  const offsetX = (p.viewWidth - scaledW) / 2;
  const offsetY = (p.viewHeight - scaledH) / 2;
  let x = offsetX + nx * scaledW;
  const y = offsetY + ny * scaledH;
  if (p.mirrored) {
    x = p.viewWidth - x;
  }
  return { x, y };
}
