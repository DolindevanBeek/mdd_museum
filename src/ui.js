
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

//load JSON data

function loadJSON(callback) {

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'projects.json', true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function openModal() {
  loadJSON(function (response) {
    // Parse JSON string into object
    var project_data = JSON.parse(response);
    console.log(project_data);

    var video_container = document.getElementById("project_view_video");
    var video = document.getElementById("project_view_video_iframe");
    var title = document.getElementById("project_view_content_title");
    var text = document.getElementById("project_view_content_text");
    var link = document.getElementById("project_view_content_link");
    var students = document.getElementById("project_view_students");

    var video_link = project_data[0].video_link;
    var video_id = video_link.substr(video_link.lastIndexOf('/') + 1);


    //check if video
    if(video_link){
      video.src = '//player.vimeo.com/video/' + video_id;
    }
    else {
      video_container.style.display = "none";
    }

    //check if project name and client
    if (project_data[0].project && project_data[0].client){
      title.innerHTML = project_data[0].project + " - " + project_data[0].client;
    }
    else if (project_data[0].project){
      title.innerHTML = project_data[0].project;
    }
    else if (project_data[0].client){
      title.innerHTML = project_data[0].client;
    }

    //check if external link
    if (project_data[0].external_link){
      link.href = project_data[0].external_link;
    }
    else {
      link.style.display = "none";
    }

    text.innerHTML = project_data[0].Text;
    students.innerHTML = project_data[0].Students;

    project_view.classList.add("visible");

  });
}

openModal();