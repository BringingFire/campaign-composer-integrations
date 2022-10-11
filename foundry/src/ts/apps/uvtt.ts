import { AmbientLightDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/ambientLightData';
import { WallDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/wallData';
import { Uvtt } from 'campaign-composer-api';

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