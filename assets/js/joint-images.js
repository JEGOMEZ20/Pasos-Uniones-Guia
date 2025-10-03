// Mapea el ID del subtipo a su archivo en /assets/joints
export const JOINT_IMAGE_MAP = {
  // Pipe unions
  welded_brazed: "pipe_welded_brazed.jpg",

  // Compression couplings
  swage: "compression_swage.jpg",
  press: "compression_press.jpg",
  typical: "compression_typical.jpg",
  bite: "compression_bite.jpg",
  flared: "compression_flared.jpg",

  // Slip-on joints
  machine_grooved: "slip_machine_grooved.jpg",
  grip: "slip_grip.jpg",
  slip_type: "slip_slip.jpg",
};

export function getJointImageSrc(subtypeId) {
  const file = JOINT_IMAGE_MAP[subtypeId] ?? "not-found.jpg";
  return `assets/joints/${file}`;
}
