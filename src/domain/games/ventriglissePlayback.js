// A fixed overview keeps the entire track inside the limiting camera angle,
// including narrow screens, while leaving race distances and scoring unchanged.
export const getVentriglisseOverviewCamera = (trackLength, trackWidth, aspect, verticalFov = 54) => {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const verticalAngle = Math.max(1, Math.min(179, verticalFov)) * Math.PI / 180
  const horizontalAngle = 2 * Math.atan(Math.tan(verticalAngle / 2) * safeAspect)
  const limitingHalfAngle = Math.min(verticalAngle, horizontalAngle) / 2
  const radius = Math.hypot(trackWidth / 2 + 2, (trackLength + 20) / 2, 8)
  const distance = radius / Math.sin(limitingHalfAngle) * 1.1
  const centerZ = 4 - trackLength / 2
  return {
    x: 0,
    y: distance * Math.sin(Math.PI / 3),
    z: centerZ + distance * Math.cos(Math.PI / 3),
    targetZ: centerZ,
    radius,
    distance,
  }
}
