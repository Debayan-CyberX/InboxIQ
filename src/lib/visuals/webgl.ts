// Small, disposable WebGL surfaces used only by the authenticated workspace.
const vertex = `attribute vec2 a_position; varying vec2 v_texcoord;
void main(){v_texcoord=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
export function createSurface(canvas: HTMLCanvasElement, fragment: string) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Workspace shader could not compile");
    return shader;
  };
  const program = gl.createProgram()!;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  const dispose = () => {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Workspace shader could not link");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const locations = new Map<string, WebGLUniformLocation | null>();
    const uniform = (name: string) => {
      if (!locations.has(name))
        locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name)!;
    };
    return {
      gl,
      uniform,
      dispose,
      draw: () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
    };
  } catch {
    dispose();
    return null;
  }
}
