
var map = document.getElementById("map_view_button");
var map_view = document.getElementById("map_view_overlay");
var about = document.getElementById("about_view_button");
var about_view = document.getElementById("about_view_overlay");
var header = document.getElementById("header");

map.addEventListener("click", function () {

  if(!map_view.classList.contains("visible")){
    map_view.style.display = "flex";
    setTimeout(function () { map_view.classList.add("visible"); }, 100);
  }
  else {
    map_view.classList.remove("visible");
    setTimeout(function () { map_view.style.display = "none"; }, 200);
  }

});

about.addEventListener("click", function () {

  if (!about_view.classList.contains("visible")) {
    about_view.style.display = "flex";
    header.classList.add("white");
    setTimeout(function () { about_view.classList.add("visible"); }, 100);
  }
  else {
    about_view.classList.remove("visible");
    header.classList.remove("white");
    setTimeout(function () { about_view.style.display = "none"; }, 200);
  }

});

//load JSON data

function loadJSON(callback) {

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'data.json', true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function init() {
  loadJSON(function (response) {
    // Parse JSON string into object
    var actual_JSON = JSON.parse(response);
    console.log(actual_JSON);
  });
}