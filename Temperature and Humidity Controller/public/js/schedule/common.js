function myFunction(id) {
	console.log(id, this);
	var x = document.getElementById(id);
	if (x.style.display === "none") {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	}
} 
function selectCheckbox(id){
	console.log(id);
	var x = document.getElementById(id);
	console.log(x);
	if(x.checked){
		// myEle.setAttribute("style", "background: #2AD705;color: #ffffff;");
		x.classList.remove("selectedCheckbox");
		x.checked = false;
	}else{
		// context.nextElementSibling.className = " deselectCheckbox"
		x.className += " selectedCheckbox";
		x.checked = true;
	}
}
// There are two boostrap collapse menus, when 1 is toggled, the other menu should collapse and vice versa, so that both menus are not displayed at the same time
function collapseMenu(id){
	$('#' + id).collapse('hide');
}
// tableId = vegWaterTable or floWaterTable
function waterSelectChanged(e, tableId){
    let tableEle = document.getElementById(tableId),
        numOfRows = e.value,
        i = 0,
        curRows = tableEle.children.length - 1; // minus the table headers

    console.log(`numOfRows: ${numOfRows}`);
    console.log(`curRows: ${curRows}`);
    if(curRows >= 0 && numOfRows > curRows){
        console.log(curRows);
        i = curRows;
        for(; i < numOfRows; i++){
            let divRow   = document.createElement("div"), // <div class="rTableRow">
                divCellWeek = document.createElement("div"), // <div class="rTableCell">Week 1</div>
                divCellDates = document.createElement("div"), // <div class="rTableCell">Dates</div>
                divCellPumpTime = document.createElement("div"), // <div class="rTableCell">Pump Run Time</div>
                divCellInchesOfWater = document.createElement("div"), // <div class="rTableCell">Inches of Water</div>
                divCellCupsOfWater = document.createElement("div"); //<div class="rTableCell">Cups of Water</div>
        
            divRow.className = "rTableRow";
            divCellWeek.className = "rTableCell";
            divCellDates.className = "rTableCell";
            divCellPumpTime.className = "rTableCell";
            divCellInchesOfWater.className = "rTableCell";
            divCellCupsOfWater.className = "rTableCell";

            divCellWeek.innerText = "Week " + (i + 1);

            tableEle.appendChild(divRow);
            divRow.appendChild(divCellWeek);
            divRow.appendChild(divCellDates);
            divRow.appendChild(divCellPumpTime);
            divRow.appendChild(divCellInchesOfWater);
            divRow.appendChild(divCellCupsOfWater);
        }
    }else{
        let rowsToRemove = curRows - numOfRows;

        console.log(`We need to remove ${rowsToRemove} rows`);
        console.log(tableEle.children);
        for(let j = curRows; j > curRows - rowsToRemove; j--){
            console.log("Removing row?");
            console.log(`j = ${j}`);
            console.log(`curRows = ${curRows}`);
            tableEle.removeChild(tableEle.children[j]);
        }
    }


    console.log(tableEle);
}
function nextPrev(e, operand) {
    console.log(e, operand);
	let ids = [
		"scheduleFieldset", 
		"vegWaterFieldset",
		"floWaterFieldset", 
		"reviewFieldset", 
		"confirmFieldset"
	], 
        activeSectionId = "",
        activeSectionIdx = -1,
        activeSectionEle = "";
    ids = ids.filter(id => document.getElementById(id) !== null);

	ids.forEach(function(id, i){
		let idEle = document.getElementById(id);
        if(idEle.hidden === false){
            idEle.hidden = true;
            activeSectionId = id;
            activeSectionIdx = i;
        }
	})
    // Are we at the last fieldset? Remove the next button
    if(activeSectionIdx + operand === ids.length - 1){
        e.style.display = "none"; 
    }
    // Are we not on the last fieldset? Show the next button
    if(activeSectionIdx + operand < ids.length - 1){
        document.getElementById("nextBtn").style.display = "inline";
    }
    // Are we on the first field set? Remove the previous button
    if(activeSectionIdx + operand === 0){
        e.style.display = "none";
    }
    // Are we after the first fieldset? Show the previous button
    if(activeSectionIdx + operand > 0){
        document.getElementById("prevBtn").style.display = "inline";
    }
    activeSectionEle = document.getElementById(ids[activeSectionIdx + operand]);
    activeSectionEle.hidden = false;

    // Help show progress of where the user is on the form
    document.getElementById("step" + activeSectionIdx).classList.remove("active");
    document.getElementById("step" + (activeSectionIdx + operand)).className += " active";
}