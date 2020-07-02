
var map = document.getElementById("map_view_button");
var map_view = document.getElementById("map_view_overlay");
var about = document.getElementById("about_view_button");
var about_view = document.getElementById("about_view_overlay");
var header = document.getElementById("header");
var project_view_close = document.getElementById("project_view_close");
var project_view = document.getElementById("project_view_overlay");

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

project_view_close.addEventListener("click", function () {
  if (project_view.classList.contains("visible")) {
    project_view.classList.remove("visible");
  }
});