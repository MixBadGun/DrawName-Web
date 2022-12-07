function excel(obj){
    if(!obj.files) {
        return;
    };
    var type = obj.files[0].name.split(".")[1]
    if(type != 'xls' && type !='xlsx'){
        alert('文件格式必须是 xls 或 xlsx 之一！')
        return
    };
    file = obj.files[0];
    var reader = new FileReader();
    var lists = [];
	reader.onload = function(e) {
		var data = e.target.result;
		var workbook = XLSX.read(data, {type: 'binary'});
        var jsonData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        jsonData = jsonData.replace(/[\n\r]/g,",");
        lists = jsonData.split(",");
        full_data = lists.filter(function(check){
            return check != "";
            });
        document.cookie = 'data='+full_data+";expires=Fri, 31 Dec 9999 23:59:59 GMT;";
        section(full_data);
        box = document.getElementById("show-box");
        box.innerHTML='';
        for(var i=0;i<splitnum;i++){
            sitem = document.createElement("div");
            sitem.className="show-item";
            box.appendChild(sitem);
    }};
    reader.readAsBinaryString(file);
    };
var images = new Array()
function preload() {
    for (var i = 0; i < preload.arguments.length; i++) {
        images[i] = new Image();
        images[i].src = preload.arguments[i]}}
var sounds = new Array()
function preload_sounds() {
    for (i = 0; i < preload_sounds.arguments.length; i++) {
        sounds[i] = new Audio();
        sounds[i].src = preload_sounds.arguments[i]}}
preload(
            "image/chose.webp",
            "image/logo.png"
                )
preload_sounds(
        "sound/passing.mp3",
        "sound/chose.mp3",
        "sound/chose2.mp3"
            )
//音效
var passing_audio = document.createElement("audio");
passing_audio.src = "sound/passing.mp3";
var chose_audio = document.createElement("audio");
chose_audio.src = "sound/chose.mp3"
var chose2_audio = document.createElement("audio");
chose2_audio.src = "sound/chose2.mp3"
passing_audio.loop = true;
//类名
text_name = "inner-text";
//拆分名字类
function getCookie(cname)
{
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++)
  {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}
full_data = getCookie("data");
if(full_data == ''){
    var full_data = ['大吉','小吉','中吉','凶','大凶']
}
else{
    full_data = full_data.split(',');
};
var namelist=[];
var splitnum=0;
var times = 0;
var total_times = 0;
function split_name(name) {
    temp_namelist = [];
    num = name.length;
    temp = "";
    for (var i=0; i<num; i++){
        temp += name[i];
        temp_namelist.push(temp);}
    return temp_namelist;}
//划分区域
function section(data){
    max=0;
    for(y in data){
        item = data[y];
        num = item.length;
        max = max < num ? num : max;
        temp = "";
        for(var x=0; x<num; x++){
            temp += item[x];
            namelist.push(temp)}
    };
    splitnum = max;
    for (var i=0;i<splitnum;i++){};
    }
function start_random(){
    if (times==0){
        random_i = Math.floor(full_data.length*Math.random());
        random_index = random_i == full_data.length ? random_i-1 : random_i;
        chosen_name = full_data[random_index];
        passing_audio.play();
        chose_audio.pause();
        chose_audio.load();
        chose2_audio.pause();
        chose2_audio.load();
        total_times ++;
    for(var i=0; i<splitnum; i++){
        gif = document.createElement("img");
        gif.className = "rolling";
        gif.src="image/chose.webp";
        box.children[i].innerHTML='';
        box.children[i].appendChild(gif);
    };
    times += 1;}
    else{
        bullon = false;
        random_item = split_name(chosen_name);
        if (times >= chosen_name.length || times == splitnum){
            bullon = true;}
        else{
            o_num = 0;
            for(i in namelist){
                temp = namelist[i];
                if (temp == random_item[times-1]){
                    o_num ++;
                };}
            if(o_num == 1){
                bullon = true;
            };
        }
        if(bullon){
            passing_audio.pause();
            passing_audio.load();
            chose_audio.play();
            outbox = document.getElementById("outbox");
            shining = document.createElement("div");
            shining.className = "shining";
            outbox.appendChild(shining);
            setTimeout(function(){
                shining.remove();
            },1000)
            if(times>0){
            for(var i=times-1;i<splitnum;i++){
                step = box.children[i];
                step.innerHTML='';
                text = document.createElement("div");
                text.className = text_name;
                if(chosen_name[i] != undefined){
                text.innerHTML = chosen_name[i];}
                else{
                    text.innerHTML = '';
                }
                step.appendChild(text);
                    };};
            times = 0;
            info = document.createElement("li");
            info.innerHTML = `<div class='times'>${total_times}</div><div class='name'>${chosen_name}</div>`;
            info_box = document.getElementById('info-box');
            info_box.appendChild(info);
            info_out = document.getElementById('info-out');
            info_out.scrollTo(
                {
                    top:info_out.scrollHeight,
                    behavior:'smooth'
                }
                );
            }
        else{
            chose2_audio.pause();
            chose2_audio.load();
            chose2_audio.play();
            step = box.children[times-1];
            step.innerHTML='';
            text = document.createElement("div");
            text.className = text_name;
            text.innerHTML = chosen_name[times-1];
            step.appendChild(text);
            times ++;
        }
            }
        }
$(document).ready(function(){
    section(full_data);
    box = document.getElementById("show-box");
    for(var i=0;i<splitnum;i++){
        sitem = document.createElement("div");
        sitem.className="show-item";
        box.appendChild(sitem);
    }}
);
window.onload=function(){
    document.getElementById('loading').className="loading-out";
    setTimeout(function(){
        document.getElementById('loading').remove();
    },500);
}
function custom_close(){
    if(confirm("您确定要退出吗？")){
        window.opener=null;
        window.open('','_self');
        window.close();
    }
    else{
    }
}
function hide_info(){
    $("#info-out").css("height","0%");
    $("#show-box").css("height","100%");
    $(".show-item").css("width","200px");
    $(".show-item").css("height","200px");
    $(".inner-text").css("font-size","125px");
    $(".inner-big-text").css("font-size","125px");
    text_name = "inner-big-text";
    $(".side-button").css("transform","scale(0)");
    $("#hide_button").attr("onclick","show_info()");
}
function show_info(){
    $("#info-out").css("height","100%");
    $("#show-box").css("height","125px");
    $(".show-item").css("width","125px");
    $(".show-item").css("height","125px");
    $(".inner-text").css("font-size","85px");
    $(".inner-big-text").css("font-size","85px");
    text_name = "inner-text";
    $(".side-button").css("transform","scale(1)");
    $("#hide_button").attr("onclick","hide_info()");
}