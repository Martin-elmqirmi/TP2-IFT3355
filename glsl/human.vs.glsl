out vec3 interpolatedNormal;
attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat4 bones[12];

void main(){
    interpolatedNormal = normal;

    vec4 newPosition = skinWeight.x * ( bones[int(skinIndex.x)] * vec4(position, 1.0))
    + skinWeight.y * ( bones[int(skinIndex.y)] * vec4(position, 1.0))
    + skinWeight.z * ( bones[int(skinIndex.z)] * vec4(position, 1.0))
    + skinWeight.w * ( bones[int(skinIndex.w)] * vec4(position, 1.0));
	
	gl_Position = projectionMatrix * modelViewMatrix * newPosition;
}