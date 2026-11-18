// Shared constants for the piling site. Metres and seconds.
export const LOOP = 48; // the whole process repeats every 48 s
export const BORE_D = 16; // pile depth
export const BORE_R = 0.5; // pile radius

// Pile positions on the ground plane (x, z). Machines are placed around these.
export const PILES = {
  rig1: { x: -8, z: 0 },
  rig2: { x: -22, z: -9 },
  cage: { x: 3.0, z: -6 },
  pour: { x: 19.0, z: -3 },
  test: { x: 52, z: 0 }, // static load test station
};
