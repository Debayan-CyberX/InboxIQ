// Adapted from dashersw/liquid-glass-js (MIT), Copyright 2025 Armagan Amcalar.
// See THIRD_PARTY_NOTICES.md. Samples only the decorative backdrop, never page content.
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_viewport;
uniform vec2 u_position;
uniform float u_light;
varying vec2 v_texcoord;

float pillDistance(vec2 coord, vec2 size, float radius) {
  vec2 pixelCoord = coord * size;
  vec2 capsuleStart = vec2(radius, size.y * 0.5);
  vec2 capsuleEnd = vec2(size.x - radius, size.y * 0.5);
  vec2 axis = capsuleEnd - capsuleStart;
  float t = clamp(dot(pixelCoord - capsuleStart, axis) / max(dot(axis, axis), 0.01), 0.0, 1.0);
  return length(pixelCoord - (capsuleStart + t * axis)) - radius;
}
void main() {
  float radius = u_resolution.y * 0.5;
  float distance = -pillDistance(v_texcoord, u_resolution, radius);
  float rim = exp(-max(distance, 0.0) * 0.38);
  float edge = exp(-max(distance, 0.0) * 0.09);
  vec2 center = vec2(0.5);
  vec2 normal = normalize((v_texcoord - center) * vec2(1.0, 2.0) + vec2(0.0001));
  vec2 screen = (u_position + vec2(v_texcoord.x, 1.0-v_texcoord.y) * u_resolution) / u_viewport;
  screen.y = 1.0-screen.y;
  vec2 refraction = normal * (edge * 0.022 + rim * 0.035);
  vec2 uv = screen + refraction;
  vec2 stepSize = vec2(2.0) / u_viewport;
  vec3 color = texture2D(u_image, uv).rgb * 0.3;
  color += texture2D(u_image, uv + vec2(stepSize.x, 0.0)).rgb * 0.175;
  color += texture2D(u_image, uv - vec2(stepSize.x, 0.0)).rgb * 0.175;
  color += texture2D(u_image, uv + vec2(0.0, stepSize.y)).rgb * 0.175;
  color += texture2D(u_image, uv - vec2(0.0, stepSize.y)).rgb * 0.175;
  vec3 tint = mix(vec3(0.055,0.075,0.11), vec3(0.84,0.88,0.94), u_light);
  color = mix(color, tint, mix(0.7,0.8,u_light));
  color += vec3(0.64,0.78,0.96) * rim * 0.18 + edge * 0.025;
  float mask = 1.0 - smoothstep(-1.0, 1.0, -distance);
  gl_FragColor = vec4(color, mask * 0.96);
}
