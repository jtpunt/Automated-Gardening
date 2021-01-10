document.addEventListener("DOMContentLoaded", function(event){
    let vegLightStartTimeId   = "veg_light_start_time",
        vegLightEndTimeId     = "veg_light_end_time",
        vegLightTimeElapsedId = "veg_light_time_elapsed";

    let floLightStartTimeId   = "flo_light_start_time",
        floLightEndTimeId     = "flo_light_end_time",
        floLightTimeElapsedId = "flo_light_time_elapsed";
        
    let vegLightStartTimeEle   = document.getElementById(vegLightStartTimeId),
        vegLightEndTimeEle     = document.getElementById(vegLightEndTimeId),
        vegLightTimeElapsedEle = document.getElementById(vegLightTimeElapsedId);

    let floLightStartTimeEle   = document.getElementById(floLightStartTimeId),
        floLightEndTimeEle     = document.getElementById(floLightEndTimeId),
        floLightTimeElapsedEle = document.getElementById(floLightTimeElapsedId);

    if(vegLightStartTimeEle !== null && vegLightEndTimeEle !== null && vegLightTimeElapsedEle !== null){
        handleTimeElapsed(vegLightStartTimeEle, vegLightEndTimeEle, vegLightTimeElapsedEle);
        vegLightStartTimeEle.onchange = function(){
            handleTimeElapsed(vegLightStartTimeEle, vegLightEndTimeEle, vegLightTimeElapsedEle);
        }
        vegLightEndTimeEle.onchange = function(){
            handleTimeElapsed(vegLightStartTimeEle, vegLightEndTimeEle, vegLightTimeElapsedEle);
        } 
    }
    
    if(floLightStartTimeEle !== null && floLightEndTimeEle !== null && floLightTimeElapsedEle !== null){
        handleTimeElapsed(floLightStartTimeEle, floLightEndTimeEle, floLightTimeElapsedEle);
        floLightStartTimeEle.onchange = function(){
            handleTimeElapsed(floLightStartTimeEle, floLightEndTimeEle, floLightTimeElapsedEle);
        }
        floLightEndTimeEle.onchange   = function(){
            handleTimeElapsed(floLightStartTimeEle, floLightEndTimeEle, floLightTimeElapsedEle);
        }
    }
})
function handleTimeElapsed(startTimeEle, endTimeEle, timeElapsedEle){
    let startTimeValue = startTimeEle.value,
        startTimeNum   = startTimeEle.valueAsNumber,
        startTimeHour  = startTimeValue.split(":")[0],
        startTimeMin   = startTimeValue.split(":")[1],
        startTimeSec   = startTimeValue.split(":")[2],
        startTimeDate   = new Date();

    let endTimeValue   = endTimeEle.value,
        endTimeNum     = endTimeEle.valueAsNumber,
        endTimeHour    = endTimeValue.split(":")[0],
        endTimeMin     = endTimeValue.split(":")[1],
        endTimeSec     = endTimeValue.split(":")[2],
        endTimeDate    = new Date();

    let timeDiff = 0;

    if(startTimeNum > endTimeNum){
        endTimeDate.setDate(endTimeDate.getDate() + 1);
        console.log("EndTime occurs on the next day" + endTimeNum);
    }
    // '00' from minute, second, or hour will create an invalid date object
    if(startTimeSec === '00')
       startTimeSec  = 0;
    if(startTimeMin  === '00')
        startTimeMin = 0;
    if(startTimeHour == '00')
        startTimeHour = 0;
    // '00' from minute, second, or hour will create an invalid date object
    if(startTimeSec === '00')
        startTimeSec = 0;
    if(startTimeMin === '00')
        startTimeMin = 0;
    if(startTimeHour == '00')
        startTimeHour = 0;
        
    startTimeDate.setHours(startTimeHour, startTimeMin, startTimeSec);  
    endTimeDate.setHours(endTimeHour, endTimeMin, endTimeSec);

    timeDiff = (endTimeDate.getTime() - startTimeDate.getTime()) / (1000*60*60);
    timeElapsedEle.value = timeDiff;
    
}
function calcElapsedTime(time1, time2){

}
function showExtraInputs(id) {
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
                divCellCupsOfWater = document.createElement("div"); //<div class="rTableCell">Cups of Water</div>
                divCellPumpTime = document.createElement("div"); // <div class="rTableCell">Pump Run Time</div>
                // divCellInchesOfWater = document.createElement("div"), // <div class="rTableCell">Inches of Water</div>
        
            divRow.className = "rTableRow";
            divCellWeek.className = "rTableCell";
            divCellDates.className = "rTableCell";
            divCellCupsOfWater.className = "rTableCell";
            divCellPumpTime.className = "rTableCell";
            divCellInchesOfWater.className = "rTableCell";

            divCellWeek.innerText = "Week " + (i + 1);

            tableEle.appendChild(divRow);
            divRow.appendChild(divCellWeek);
            divRow.appendChild(divCellDates);
            divRow.appendChild(divCellCupsOfWater);
            divRow.appendChild(divCellPumpTime);
            //divRow.appendChild(divCellInchesOfWater);
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
function handleMultiStepForm(e, operand){
    let ids = [
        "scheduleFieldset", 
        "vegWaterFieldset",
        "floWaterFieldset", 
        "reviewFieldset", 
        "confirmFieldset"
    ]
    /* 
     * Based on the room type - veg and/or flowering sections may not be generated by EJS.
     * Remove ids of elements that don't exist on the page    
     */
    ids = ids.filter(id => document.getElementById(id) !== null);
    nextPrev(e, operand, ids);
}