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