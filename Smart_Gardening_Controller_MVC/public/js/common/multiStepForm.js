function nextPrev(e, operand, ids) {
	let activeSectionId  = "",
        activeSectionIdx = -1,
        activeSectionEle = "";

    let submitBtnId  = "submitBtn",
        nextBtnId    = "nextBtn",
        prevBtnId    = "prevBtn",
        submitBtnEle = document.getElementById(submitBtnId),
        nextBtnEle   = document.getElementById(nextBtnId),
        prevBtnEle   = document.getElementById(prevBtnId);

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
        submitBtn.style.display = "inline";
    }
    // Are we not on the last fieldset? Show the next button
    if(activeSectionIdx + operand < ids.length - 1){
        nextBtn.style.display = "inline";
        submitBtn.style.display = "none";
    }
    // Are we on the first field set? Remove the previous button
    if(activeSectionIdx + operand === 0){
        e.style.display = "none";
    }
    // Are we after the first fieldset? Show the previous button
    if(activeSectionIdx + operand > 0){
        prevBtn.style.display = "inline";
    }
    activeSectionEle = document.getElementById(ids[activeSectionIdx + operand]);
    activeSectionEle.hidden = false;

    // Help show progress of where the user is on the form
    document.getElementById("step" + activeSectionIdx).classList.remove("active");
    document.getElementById("step" + (activeSectionIdx + operand)).className += " active";
}