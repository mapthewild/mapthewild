// Keep the painted outline unchanged, but give its height the depth of an upright
// person. A plane parallel to this elevated camera otherwise lies through the
// seats, paddle and hull. Disabling depth testing would put feet over the hull.
export function setBoatDepth(sprite, camera, amount) {
  if (sprite.userData.boatDepth === amount) return;
  const up = camera.matrixWorld.elements;
  const slope = -up[6] / up[10] * amount;
  const vertices = sprite.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    vertices.setZ(i, vertices.getY(i) * slope);
  }
  vertices.needsUpdate = true;
  sprite.geometry.computeBoundingSphere();
  sprite.userData.boatDepth = amount;
}
