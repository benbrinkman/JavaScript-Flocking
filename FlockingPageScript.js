/*
This project is dedicated to learning how to use Object Oriented Code in the HTML Canvas using JavaScript
To learn it, I assigned myself the task of creating a flocking (boids) mechanism. For more information on boids, see https://www.red3d.com/cwr/boids/
All code is written by Ben Brinkman
*/

//on page load begin
window.addEventListener('load', function(){
	"use strict";
	var ctx = document.getElementById("Encase").getContext('2d');
	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	
	//number of boids objects
	var numBoids = 50;
	
	//limiting the speed
	var maxSpeed = 3;
	var maxSteeringForce = 0.03;
	 
	//distance to check for other boids to separate from
	var desiredSeparation = 50;
	
	//distance to search for cohesion and alignment
	var searchDistance = 200.0;
	
	//distance to follow/repel from -- unimplimented
	var followDis = 200.0;
	
	//weight of the three flocking influences
	var seperationWeight =1;
	var alignmentWeight =1;
	var cohesionWeight =0.1;
	
	//radius of boids
	var radius=10;
	
	//initialize flock
	var flock =[];
	
	//create a boid object and fill the flock array
	function init(){
		for (var i = 0; i < numBoids;i++){
			flock[i] = Object.create(boid);
			flock[i].initBoid();
			flock[i].updateBoid();
		}
	}
	
	//update every frame
	function update(){
		//ctx.save() and ctx.restore() reset the transformations and rotations used to move objects on screen
		ctx.save();
		
		//reset background color every frame
		ctx.clearRect(0,0,height, width);	
		
		//for every boid:		
		for(var i = 0; i < flock.length; i++){
			ctx.save();
			//call the flocking updates
			flock[i].flocking(flock);
			//call the main update
			flock[i].updateBoid();
			
			//draw the boid with it's transformation and rotation
			ctx.fillStyle = "green";
			ctx.translate(flock[i].position.x,flock[i].position.y);
			ctx.rotate(flock[i].velocity.heading());
			ctx.fillRect(0,0,radius+5,radius);
			ctx.restore();
		}
		ctx.restore();
	}
	
	
	//My vector handler
	var vector = {
		//create an object with an x and y variable
		init: function(x, y){
			this.x = x;
			this.y = y;	
		},
		//for adding two functions
		add: function(_vector){
			this.x+=_vector.x;
			this.y+=_vector.y;
			return this;
		},
		//for subtracting two function -- having issues with this one, using subtract function outside vector instead
		subtract: function(_vector){
			this.x-=_vector.x;
			this.y-=_vector.y;
		},
		//multiplying by either a scalar or a vector
		mult: function(_vector){
			if(typeof "_vector" === "object"){
				this.x*=_vector.x;
				this.y*=_vector.y;		
				return this;
			}
			this.x*=_vector;
			this.y*=_vector;
			return this;
		},
		//dividing by either a scalar or a vector
		div: function(_vector){
			if(typeof "_vector" === "object"){
				this.x/=_vector.x;
				this.y/=_vector.y;		
				return this;
			}
			else{
				this.x/=_vector;
				this.y/=_vector;
				return this;
			}
		},
		//normalize the function -- U = V / M, where U is the normalized vector, v is the original vector, and m is the magnitude of the original vector
		normalize: function(){
			var u = Vector(0,0);
			var v = this;
			var m = this.mag();
			if(m!==0)
			{
				u = v.div(m);
			}
			return u;
		},
		//get the magnitude of a vector -- sqrt(x^2+y^2)
		mag: function(){
			return Math.pow((this.x*this.x + this.y*this.y), 0.5);	
		},
		//squared magnitude, used for finding the limit
		magSq: function(){
			return(this.x*this.x + this.y*this.y);
		},
		//lmit the vector to a maximum value. If the absolute value of the magnitude is greater than the max value, it gets normalized to the max value
		limit: function(maxVal){
			if(this.magSq() > maxVal*maxVal){
				this.normalize();
				this.mult(maxVal);
			}
			return this;	
		},
		//find the angle between (0,0) and this vector's (x,y)
		heading: function(){
			var angle = Math.atan2(this.y, this.x);
			return angle;	
		}
	};
	
	//easy way to create new vector object at an input x and y
	function Vector(x, y){
		var object = Object.create(vector);
		object.init(x,y);
		return object;
	}
	
	//temp subtract function for vectors -- vector one is not working properly
	var subtract = function(vector1, vector2){
		var subbed = Vector(vector1.x-vector2.x, vector1.y-vector2.y);
		return subbed;
	};
	
	
	//distance function -- sqrt( (x1-x2)^2 + (y1-y2)^2 )
	function dist(vec1, vec2){
		var a = vec1.x - vec2.x;
		var b = vec1.y - vec2.y;
		var c = Math.sqrt(a*a+b*b);
		return c;
	}
	
	/*
	The following two functions were taken from: https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
	*/
		
	//getting random int
	function getRndInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1) ) + min;
	}
	
	//getting random float	
	function getRndFloat(min, max) {
		return Math.random() * (max - min) + min;
	}
	
	//when objects go off one side of the screen, come back on the other	
	function screenWrap (vector) {
		if (vector.x < 0){vector.x = width;}
		else if (vector.x > width)	{vector.x = 0;}
		if (vector.y < 0){vector.y = height;}
		else if (vector.y > height){vector.y = 0;}
	}
		
	//boid object
	var boid = {
		
		//initialize position and zeroed out velocity and acceleration
		initBoid: function(){
			this.position = Vector(getRndFloat(0.0, width), getRndFloat(0.0, height));
			this.velocity = Vector(0.0,0.0);
			this.acceleration = Vector(0.0,0.0);
		},
		//update boid
		updateBoid: function(){
			//add acceleration to velocity
			this.velocity.add(this.acceleration);
			
			//this.velocity.add(this.acceleration.mult(0.9)); 	//attempt to smooth jitteryness by lowering applied acceleration
			//this.velocity.mult(0.9); 							//attempt to smooth jitteryness by lowering velocity
			
			//add velocity to position
			this.position.add(this.velocity);
			//zero out acceleration
			this.acceleration.mult(0);
			//screenwrap objects
			screenWrap(this.position);
		},
		
		//applying forces to boids object
		applyForce: function(force){
			this.acceleration.add(force);
		},
		
		//apply the 3 flocking forces to the boids objects, and adjust them by their weighting
		flocking: function(boids){
			this.applyForce(this.seperate(boids));
			this.applyForce(this.align(boids));
			this.applyForce(this.cohesion(boids));
		},
		
		//make boids objects aware of each other, move away from other nearby boids
		seperate: function(boids){
			var steer = Vector(0,0);
			var count = 0;
		    
		 	for(var i = 0; i < boids.length; i++){
				var d = dist(this.position, boids[i].position);
				if (d < desiredSeparation && d > 0)
				{
					var delta = Vector();
					delta = subtract(this.position, boids[i].position);
					delta.normalize();
					delta.div(d);
					steer.add(delta);
					count++;
					
				}
			}
			if(count >0){
				steer.div(count); 
				steer.normalize();
				steer.mult(maxSpeed);
				steer = subtract(steer, this.velocity);
				steer.limit(maxSteeringForce);
			}
			steer.mult(seperationWeight);
			return steer;
		},
		//move boids towards the average position of nearby boids, making group stick together
		cohesion: function(boids){
			var sum = Vector(0,0);
			var count = 0;
		    
		 	for(var i = 0; i < boids.length; i++){
				var d = dist(this.position, boids[i].position);
				if (d < searchDistance && d > 0)
				{
					sum.add(boids[i].position);
					count++;
				}
			}
			if(count >0){
				sum.div(count); 
				
				var desired = Vector(0,0);
				desired = subtract(sum, this.position);
				desired.normalize();
				desired.mult(maxSpeed);
				
				var steer = Vector(0,0);
				steer = subtract(desired, this.velocity);
				steer.limit(maxSteeringForce);
				steer.mult(cohesionWeight);
				return steer;
			}
			return Vector(0,0);
		},
		//steer towards the average velocity of nearby boids, making flocks travel in the same direction
		align: function(boids){
			var sum = Vector(0,0);
			var count = 0;
		    
		 	for(var i = 0; i < boids.length; i++){
				var d = dist(this.position, boids[i].position);
				if (d < searchDistance && d > 0)
				{
					sum.add(boids[i].velocity);
					count++;
					
				}
			}
			if(count >0){
				
				sum.div(count); 
				sum.normalize();
				sum.mult(maxSpeed);
				var alignment = Vector(0,0);
				alignment= subtract(sum,this.velocity);
				//alignment.normalize();
				//alignment.mult(maxSpeed);
				alignment.limit(maxSteeringForce);
				alignment.mult(alignmentWeight);
				return alignment;
			}
			return Vector(0,0);
		},
	};
	
	//Initialize and update
	init();
	setInterval(update, 30);
});

//for images
/*
function Test(){
	"use strict";
	var ballImg = new Image();
	ballImg.src = 'assets/ball.png';
	ctx.drawImage(ballImg, 0, 0);
}*/


