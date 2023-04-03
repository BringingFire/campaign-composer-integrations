import type { AmbientLightDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/ambientLightData';
import type { WallDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/wallData';
import type { Uvtt } from 'campaign-composer-api';

export interface Point {
  x: number;
  y: number;
}

export function getLights(
  uvtt: Uvtt,
  origin: Point,
): AmbientLightDataConstructorData[] {
  const ppg = uvtt.resolution!.pixels_per_grid!;
  const lights: AmbientLightDataConstructorData[] = (uvtt.lights ?? []).map(
    (light) => {
      return {
        x: light.position.x * ppg + origin.x,
        y: light.position.y * ppg + origin.y,
        config: {
          bright: light.range! * 4,
          dim: light.range! * 2,
          color: `#${light.color.substring(2)}`,
          alpha: light.intensity * 0.05,
        },
      };
    },
  );
  console.log(lights);
  return lights;
}

export function getWalls(uvtt: Uvtt, origin: Point): WallDataConstructorData[] {
  const pixelsPerGrid = uvtt.resolution!.pixels_per_grid!;
  const result: (WallDataConstructorData | undefined)[] = [];
  const walls = uvtt.line_of_sight!;

  for (let i = 0; i < walls.length; i++) {
    const wallPoints = walls[i];
    for (let k = 0; k < wallPoints.length - 1; k++) {
      result.push(
        makeWall(wallPoints[k], wallPoints[k + 1], origin, pixelsPerGrid),
      );
    }
  }

  return result.filter(notEmpty);
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

function makeWall(
  pointA: Point,
  pointB: Point,
  origin: Point,
  pixelsPerGrid: number,
): WallDataConstructorData | undefined {
  try {
    return {
      c: [
        pointA.x * pixelsPerGrid + origin.x,
        pointA.y * pixelsPerGrid + origin.y,
        pointB.x * pixelsPerGrid + origin.x,
        pointB.y * pixelsPerGrid + origin.y,
      ],
    };
  } catch (e) {
    console.error('Could not create Wall Document: ' + e);
  }
  return;
}

export function getDoors(uvtt: Uvtt, origin: Point): WallDataConstructorData[] {
  const ppg = uvtt.resolution!.pixels_per_grid!;
  return uvtt.portals!.map((portal) => {
    const bounds0 = portal.bounds![0];
    const bounds1 = portal.bounds![1];
    return {
      c: [
        bounds0.x * ppg + origin.x,
        bounds0.y * ppg + origin.y,
        bounds1.x * ppg + origin.x,
        bounds1.y * ppg + origin.y,
      ],
      door: portal.closed!
        ? CONST.WALL_DOOR_TYPES.DOOR
        : CONST.WALL_DOOR_TYPES.NONE,
      light: portal.closed
        ? CONST.WALL_SENSE_TYPES.NORMAL
        : CONST.WALL_SENSE_TYPES.NONE,
      sight: portal.closed
        ? CONST.WALL_SENSE_TYPES.NORMAL
        : CONST.WALL_SENSE_TYPES.NONE,
    };
  });
}
