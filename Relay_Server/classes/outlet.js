const Gpio = require('onoff').Gpio;
//https://www.npmjs.com/package/onoff
class RelaySettings{
	#relayId
	#direction
	#gpio
	#relayType
	constuctor(relaySettings){
		this.#relayId 	= relaySettings['relayId'];
		this.#direction = relaySettings['direction'];
		this.#gpio 		= relaySettings['gpio'];
		this.#relayType = relaySettings['relayType'];
	}
	/*************************** RelaySettings GETTERS ***************************/
	get relayId() {  return this.#relayId;	 }
	get direction(){ return this.#direction; }
	get gpio()     { return this.#gpio; 	 }
	get relayType(){ return this.#relayType; }
	/*************************** RelaySettings SETTERS ***************************/
	set direction(direction){ this.#direction = direction; }
	set gpio(gpio)			{ this.#gpio      = gpio; 	   }
	set relayType(relayType){ this.#relayType = relayType; }
}
class Outlet extends RelaySettings{
	#outlet
	#initialState 
	#options
	constuctor(relaySettings){
		console.log("in outlet constuctor");
		super(relaySettings);
		this.#options = { reconfigureDirection: true };
		this.#outlet = new Gpio(this.gpio, this.direction, this.options);
		// if readSync() is 1 after initializing the GPIO, this does not mean it's on, it's really off
		// store the initialState so we can return the correct status and activate the outlet to the
		// correct state
		this.#initialState = this.outlet.readSync();
	}
	get outlet()	  { return this.#outlet;	   }
	get initialState(){ return this.#initialState; }
	get options()     { return this.#options;      }
	get status(){
		let current_state = this.outlet.readSync();
		if(initialState) current_state ^= 1;
		return current_state;
	}
	set activate(desired_state){
		let current_state = this.status(),
			desired_state = Number(desired_state);
		if(current_state === desired_state){
			console.log("Device is already in the desired state!");
		}else{
			if(initialState) desired_state ^= 1;
			this.outlet.writeSync(desired_state);
		}
	}
	set reconfigureDirection(direction){
		this.#direction = direction;
		this.#outlet.setDirection(direction);
	}
	updateOutlet(gpio, direction){
		this.outlet.unexport();
		this.gpio = gpio;
		this.direction = direction;
		this.outlet = new Gpio(this.gpio, this.direction);
	}
}
class OutletBuilder(){
	withRelaySettings(relaySettings){
		this.relaySettings = relaySettings;
		return this;
	}
	withOutlet(outlet){
		this.outlet = outlet;
		return this;
	}
	build(){
		return new Outlet();
	}
}
module.exports = Outlet;