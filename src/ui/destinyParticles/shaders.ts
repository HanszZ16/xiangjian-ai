export const velocityFragment = /* glsl */ `
uniform float uDelta;
uniform float uTime;
uniform float uRadius;
uniform float uStrength;
uniform float uPressed;
uniform sampler2D uRest;
uniform vec3 uPointer;
uniform vec3 uOffset;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec3 target = texture2D(uRest, uv).xyz + uOffset;

  float phase = uv.x * 13.0 + uv.y * 19.0;
  target.z += sin(uTime * 0.45 + phase) * 0.035;

  vec3 force = (target - pos) * 3.15;
  vec3 delta = pos - uPointer;
  float distanceToPointer = length(delta.xy);
  float influence = smoothstep(uRadius, 0.0, distanceToPointer) * uStrength;
  vec3 direction = delta / max(length(delta), 0.0001);
  vec3 tangent = vec3(-direction.y, direction.x, 0.0);

  if (uPressed > 0.5) {
    force -= direction * influence * 24.0;
    force += tangent * influence * 34.0;
  } else {
    force += direction * influence * 42.0;
    force += tangent * influence * 7.0;
  }

  vel += force * uDelta;
  vel *= pow(0.925, uDelta * 60.0);
  float speed = length(vel);
  if (speed > 24.0) vel = vel / speed * 24.0;

  gl_FragColor = vec4(vel, 1.0);
}
`

export const positionFragment = /* glsl */ `
uniform float uDelta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  gl_FragColor = vec4(pos + vel * uDelta, 1.0);
}
`

export const renderVertex = /* glsl */ `
uniform sampler2D uPosition;
uniform sampler2D uVelocity;
uniform float uPixelRatio;
attribute vec2 aReference;
attribute float aScale;
attribute float aRandom;
varying float vSpeed;
varying float vRandom;

void main() {
  vec3 pos = texture2D(uPosition, aReference).xyz;
  vec3 vel = texture2D(uVelocity, aReference).xyz;
  vSpeed = length(vel);
  vRandom = aRandom;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.15 + aScale * 1.8) * uPixelRatio;
}
`

export const renderFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uSeal;
uniform vec3 uFaint;
varying float vSpeed;
varying float vRandom;

void main() {
  vec2 point = gl_PointCoord - 0.5;
  float distanceFromCenter = length(point);
  if (distanceFromCenter > 0.5) discard;

  float glow = pow(smoothstep(0.5, 0.0, distanceFromCenter), 1.35);
  float energy = clamp(vSpeed / 5.0, 0.0, 1.0);
  float twinkle = 0.7 + 0.3 * sin(uTime * 1.7 + vRandom * 31.0);
  vec3 resting = mix(uFaint, uAccent, 0.36 + vRandom * 0.42);
  vec3 color = mix(resting, uSeal, energy * 0.8);
  float alpha = glow * twinkle * (0.13 + energy * 0.68);
  gl_FragColor = vec4(color, alpha);
}
`
