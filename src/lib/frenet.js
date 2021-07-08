/*
 * @Author: your name
 * @Date: 2021-06-10 17:38:05
 * @LastEditTime: 2021-06-16 16:28:35
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \deepln-dazhou-new\src\lib\frenet.js
 */
import { vec3 } from "gl-matrix";

export function frenet(array) {
  const consistent_normals = 1;
  const view_up = 0;
  const tangents = [];
  const normals = [];
  for (let i = 0; i < array.length; i++) {
    let tangent;
    if (i === 0) {
      tangent = getTangent(array[0], array[1]);
    } else if (i === array.length - 1) {
      tangent = getTangent(array[array.length - 2], array[array.length - 1]);
    } else {
      tangent = getTangent(array[i - 1], array[i + 1]);
    }
    vec3.normalize(tangent, tangent);
    tangents.push(tangent);
  }
  for (let i = 0; i < array.length; i++) {
    let normal;
    if (!consistent_normals || i === 0) {
      let tangentLast;
      let tangentNext;
      if (i === 0) {
        tangentLast = tangents[i];
      } else {
        tangentLast = tangents[i - 1];
      }
      if (i === array.length - 1) {
        tangentNext = tangents[i];
      } else {
        tangentNext = tangents[i + 1];
      }
      normal = getNormal(tangentLast, tangentNext);
      if (consistent_normals) {
        rotateVector(normal, tangentLast, view_up);
      }
      vec3.normalize(normal, normal);
      normals.push(normal);
    }
    if (consistent_normals && i !== 0) {
      let tangent = tangents[i];
      let normalLast = normals[i - 1];
      normal = getConsistentNormal(tangent, normalLast);
      vec3.normalize(normal, normal);
      normals.push(normal);
    }
  }
  // console.log("tangents", tangents)
  // console.log("normals", normals)
  return { tangents, normals };
}
function getTangent(pointLast, pointNext) {
  return vec3.fromValues(
    (pointLast[0] - pointNext[0]) / 2,
    (pointLast[1] - pointNext[1]) / 2,
    (pointLast[2] - pointNext[2]) / 2
  );
}
function getConsistentNormal(tangent, normalLast) {
  const result = vec3.create();
  const temp = vec3.create();
  vec3.cross(temp, normalLast, tangent);
  vec3.cross(result, tangent, temp);
  return result;
}
function getNormal(tangentLast, tangentNext) {
  const normal = vec3.fromValues(
    tangentNext[0] - tangentLast[0],
    tangentNext[1] - tangentLast[1],
    tangentNext[2] - tangentLast[2]
  );
  if (
    normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2] ===
    0
  ) {
    const unit = vec3.fromValues(1, 0, 0);
    vec3.cross(normal, tangentLast, unit);
  }
  return normal;
}
function rotateVector(vector, axis, angle) {
  const result = vec3.create();
  const dot = vec3.dot(vector, axis);
  const vec = vec3.create();
  vec3.cross(vec, axis, vector);
  for (let i = 0; i < 3; i++) {
    result[i] =
      Math.cos(angle) * vector[i] +
      (1 - Math.cos(angle)) * dot * axis[i] +
      Math.sin(angle) * vec[i];
  }
  return result;
}
