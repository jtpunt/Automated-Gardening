const Gpio = require('onoff').Gpio;
class RelaySettings{
	#relayId
	#direction
	#gpio
	#relayType
	constuctor(relayId, direction, gpio, relayType){
		this.#relayId 	= relayId;
		this.#direction = direction;
		this.#gpio 		= gpio;
		this.#relayType = relayType;

	}
	get relayId() {
		return this.#relayId;
	}
	get direction(){
		return this.#direction;
	}
	get gpio(){
		return this.#gpio;
	}
	get relayType(){
		return this.#relayType;
	}
	
}
class Outlet extends RelaySettings{
	#outlet
	#initialState 
	constuctor(relayId, direction, gpio, relayType){
		super(relayId, direction, gpio, relayType);
		this.#outlet = new Gpio(this.gpio, this.direction);
		// if readSync() is 1 after initializing the GPIO, this does not mean it's on, it's really off
		// store the initialState so we can return the correct status and activate the outlet to the
		// correct state
		this.#initialState = this.outlet.readSync();
	}
	get outlet(){
		return this.#outlet;
	}
	get initialState(){
		return this.#initialState;
	}
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
}