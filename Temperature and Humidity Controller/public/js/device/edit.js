function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
function handleDelete(e){
    let form_group = e.parentNode,
        fieldset   = form_group.parentNode;
    removeAllChildNodes(fieldset);
    fieldset.parentNode.removeChild(fieldset);
}
function getGpioSelectForm(deviceType){
    let container  = document.createElement("fieldset"),
        legend     = document.createElement("legend"),
        form_group = document.createElement("div"),
        label      = document.createElement("label"),
        select     = document.createElement("select"),
        option     = document.createElement("option"),
        delBtn     = document.createElement("button");
        accepted_gpios = [2,3,4,5,6,12,13,16,17,18,19,20,21,22,23,24,25,26,27];
    
    legend.innerText     = "GPIO Information";
    form_group.className = "form-group row";
    label.htmlFor        = "gpio";
    label.innerText      = "GPIO #";
    label.className      = "col-sm-6 col-form-label";
    select.name          = "gpio";
    select.className     = "col-sm-20";
    delBtn.className     = "btn btn-warning";
    delBtn.innerText     = "Delete";
    option.value         = -1;
    option.disabled      = true;
    option.innerText     = "Select Your GPIO Pin #:";
    
    form_group.appendChild(label);
    form_group.appendChild(select);
    form_group.appendChild(delBtn);
    select.appendChild(option);

    accepted_gpios.forEach(function(myGpio){
       var option = document.createElement("option"); 
       option.value = myGpio;
       option.innerText = myGpio;
       select.appendChild(option);
    });
    
    delBtn.onclick = function(e){
        handleDelete(this);
    }
    container.append(legend);
    container.append(form_group);
    if(deviceType === "Relay Server"){
        console.log("Relay Server found in getGpioSelectForm()");
        let form_group_relay_type = document.createElement("div"),
            labelRelaytype        = document.createElement("label"),
            selectRelayType       = document.createElement("select"),
            optionRelayType       = document.createElement("option"),
            form_group_direction  = document.createElement("div"),
            labelDirection        = document.createElement("label"),
            selectDirection       = document.createElement("select"),
            relayTypesArr         = ['air conditioner', 'light', 'water pump'],
            directionArr          = ['in', 'out', 'high', 'low'];

        form_group_relay_type.className = "form-group row";
        labelRelaytype.htmlFor          = "relaySettings[relayType]";
        labelRelaytype.innerText        = "Relay Type";
        labelRelaytype.className        = "col-sm-6 col-form-label";
        selectRelayType.name            = "relaySettings[relayType]";
        selectRelayType.className       = "col-sm-20"

        optionRelayType.value = -1;
        optionRelayType.disabled;
        optionRelayType.innerText = "Select Your Relay Type";

        form_group_direction.className = "form-group row";
        labelDirection.htmlFor         = "relaySettings[direction]";
        labelDirection.innerText       = "Direction";
        labelDirection.className       = "col-sm-6 col-form-label";
        selectDirection.name           = "relaySettings[direction]";
        selectDirection.className      = "col-sm-20";
        
        form_group_relay_type.appendChild(labelRelaytype);
        form_group_relay_type.appendChild(selectRelayType);

        form_group_direction.appendChild(labelDirection);
        form_group_direction.appendChild(selectDirection);
        selectRelayType.appendChild(optionRelayType);

        relayTypesArr.forEach(function(relayType){
            var option = document.createElement("option"); 
            option.value = relayType;
            option.innerText = relayType;
            selectRelayType.appendChild(option);
        });
        directionArr.forEach(function(direction){
            var option = document.createElement("option"); 
            option.value = direction;
            option.innerText = direction;
            selectDirection.appendChild(option);
        })
        container.append(form_group_relay_type);
        container.append(form_group_direction);
    } 
    return container;
}
