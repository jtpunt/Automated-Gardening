// When a user selects a Relay Server from the multiselect form and it is determined (from 
// EJS code below) that this relay is associated with a 'water pump' device, this function
// will target extra inputs that are hidden below the Relay Server multiselect form
// and make them visible to the user. This will offer a dynamic way to gather more data
// on the water pump being used, the container size it's in, and how many lines are being used
// If a user selects multiple Relay Servers that powers a water pump, this function will
// display as many additional inputs as needed.
// If a user deselects a Relay Server that powers a water pump, that the additional
// inputs that were displayed are hidden and disabled to prevent that data from being posted
// back to the server.
function relaySelectFn(event) {
    let waterDetailsContainer = document.getElementById("waterDetailsContainer");
    let relayServerSelect = document.getElementById("relayServerSelect");

    let isOneEleVisible = false;
    for(let i = 0; i < event.options.length; i++){
        let waterDetailsId = event.options[i].value;
        if(waterDetailsId !== "-1"){
            let waterDetailsEle = document.getElementById(waterDetailsId);
            if(waterDetailsEle !== null){

                let waterDetailsChildren = waterDetailsEle.children;
    
                if(event.options[i].selected){
                    waterDetailsContainer.hidden = false;
                    waterDetailsEle.hidden = false;

                    isOneEleVisible = true;
                    // 3x <div class="form-group row">
                    // 1x <hr style="border: 1px solid black;">
                    for(let k = 0; k < waterDetailsChildren.length; k++){
                        // our divs have child nodes, but the hr does not
                        // the divs contain our inputs which we need to enable
                        // so that they can be posted back to the server
                        if(waterDetailsChildren[k].children.length){
                            let waterDetailsNestedChildren = waterDetailsChildren[k].children;
                            for(let j = 0; j < waterDetailsNestedChildren.length; j++){
                                if(waterDetailsNestedChildren[j].tagName.toLowerCase() === 'input'){
                                    let input = waterDetailsNestedChildren[j];
                                    input.disabled = false;

                                }
                            }
                        }
                    }
                }else{
                    waterDetailsContainer.hidden = false
                    waterDetailsEle.hidden = true;

                    // 3x <div class="form-group row">
                    // 1x <hr style="border: 1px solid black;">
                    for(let k = 0; k < waterDetailsChildren.length; k++){
                        // our divs have child nodes, but the hr does not
                        // the divs contain our inputs which we need to enable
                        // so that they can be posted back to the server
                        if(waterDetailsChildren[k].children.length){
                            let waterDetailsNestedChildren = waterDetailsChildren[k].children;
                            for(let j = 0; j < waterDetailsNestedChildren.length; j++){
                                if(waterDetailsNestedChildren[j].tagName.toLowerCase() === 'input'){
                                    let input = waterDetailsNestedChildren[j];
                                    input.disabled = true;

                                }
                            }
                        }
                    }
                }   
            }
        }
    }
    if(isOneEleVisible === false){
        waterDetailsContainer.hidden = true;
    }
}