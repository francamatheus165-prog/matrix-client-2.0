precision mediump float; uniform float u_intensity; varying vec2 v_uv; void main(){ vec2 p=v_uv-.5; float d=length(p); vec3 c=vec3(.55,.25,.9)*(1.0-d*1.8)*u_intensity; gl_FragColor=vec4(c,.18);}
