precision mediump float; uniform float u_intensity; varying vec2 v_uv; void main(){ float s=sin(v_uv.y*900.0)*.5+.5; gl_FragColor=vec4(vec3(.2,.25,.4)*s*u_intensity,.10);}
