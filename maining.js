function reloadObj(redata,cookie_b){
    full_data = redata;
    full_norepeat = full_data;
    if(cookie_b != false){
        document.cookie = 'data='+full_data+";expires=Fri, 31 Dec 9999 23:59:59 GMT;";
        }
    section(full_data);
    box = document.getElementById("show-box");
    box.innerHTML='';
    for(var i=0;i<splitnum;i++){
        sitem = document.createElement("div");
        sitem.className="show-item";
        box.appendChild(sitem);
    }
}

function excel(obj){
    if(!obj.files) {
        return;
    };
    let type = obj.files[0].name.split(".")[1]
    if(type != 'xls' && type !='xlsx'){
        alert('文件格式必须是 xls 或 xlsx 之一！')
        return
    };
    let file = obj.files[0];
    let reader = new FileReader();
    let lists = [];
	reader.onload = function(e) {
		let data = e.target.result;
		let workbook = XLSX.read(data, {type: 'binary'});
        let jsonData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        jsonData = jsonData.replace(/[\n\r]/g,",");
        let lists = jsonData.split(",");
        reloadObj(lists.filter(function(check){return check != "";}),true);
    };
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
            "image/chose_0.webp",
            "image/chose_1.webp",
            "image/chose_2.webp",
            "image/chose_3.webp",
            "image/chose_4.webp",
            "image/chose_5.webp",
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
    var full_data = ['大吉','小吉','中吉','凶','大凶'];
}
else{
    var full_data = full_data.split(',');
};
var full_norepeat = full_data;
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
    let max = 0;
    namelist = [];
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

var no_repeat = false;

function ifnorepeat(){
    no_repeat = !no_repeat;
    full_norepeat = full_data;
    if(no_repeat){
        mdui.snackbar({
            message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 已切换不重复模式',
            position: 'top'
        })
    } else {
        mdui.snackbar({
            message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 已关闭不重复模式',
            position: 'top'
        })
    }
}
function start_random(){
    var chose_list = no_repeat ? full_norepeat : full_data;
    if (times==0){
        box = document.getElementById("show-box");
        for(var i=0;i<splitnum;i++){
            hcl = h_info ? "show-item-big" : "show-item";
            box.children[i].className = hcl;
        }
        random_i = Math.floor(chose_list.length*Math.random());
        random_index = random_i == chose_list.length ? random_i-1 : random_i;
        chosen_name = chose_list[random_index];
        full_norepeat = chose_list.filter(function(ite){
            return ite != chosen_name
        });
        if(no_repeat == true){
            if(!(full_norepeat.length > 0)){
                full_norepeat = full_data;
                mdui.snackbar({
                    message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 所有元素均已抽取，不重复模式已重置',
                    position: 'top'
                })
            }
        }
        passing_audio.play();
        chose_audio.pause();
        chose_audio.load();
        chose2_audio.pause();
        chose2_audio.load();
        total_times ++;
    for(var i=0; i<splitnum; i++){
        gif = document.createElement("div");
        gif.className = "rolling";
        gif.style = `background-image: url('./image/chose_${(i % 6)}.webp');`
        box.children[i].innerHTML='';
        box.children[i].appendChild(gif);
    };
    times += 1;
    } else {
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
            shining = document.getElementById("shining");
            shining.classList.remove("shining")
            void shining.offsetWidth
            shining.classList.add("shining")
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
                    step.className = "show-item-none";

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

var present_list = [];
$(document).ready(function(){
    section(full_data);
    box = document.getElementById("show-box");
    for(var i=0;i<splitnum;i++){
        sitem = document.createElement("div");
        sitem.className="show-item";
        box.appendChild(sitem);
    }
    let present_chose = document.getElementById("presents");
    let j = 0;
    for(let p = 0;p<presentList.length;p++){
        let nowp = presentList[p];
        let subnowp = document.createElement("li");
        subnowp.className = "mdui-subheader";
        subnowp.innerHTML = nowp.category;
        present_chose.appendChild(subnowp);
        let pitem = nowp.value;
        for(let m = 0;m<pitem.length;m++){
            let nowitem = pitem[m];
            present_list.push(nowitem);
            let pres = document.createElement("li");
            let icon = document.createElement("i");
            let name = document.createElement("span");
            icon.innerHTML = nowitem.icon;
            icon.className = "mdui-icon material-icons";
            name.innerHTML = nowitem.name;
            name.className = "pres-name",
            pres.appendChild(icon);
            pres.appendChild(name);
            pres.setAttribute("data-id",j);
            pres.className = "mdui-list-item mdui-ripple";
            pres.setAttribute("onclick","change_pre(this);");
            present_chose.appendChild(pres);
            j ++;
        }
    }
    }
);

function custom_close(){
    window.close();
}
var h_info = false;
function hide_info(){
    h_info = !h_info;
    box = document.getElementById("show-box");
    for(var i=0;i<splitnum;i++){
        hcl = h_info ? "show-item-big" : "show-item";
        box.children[i].className = hcl;
    }
    if(h_info) {
        $("#info-out").css("height","0%");
        $("#show-box").css("height","100%");
        $(".inner-text").css("font-size","125px");
        $(".inner-big-text").css("font-size","125px");
        text_name = "inner-big-text";
    } else {
        $("#info-out").css("height","100%");
        $("#show-box").css("height","125px");
        $(".show-item-big").css("min-width","125px");
        $(".show-item-big").css("min-height","125px");
        $(".inner-text").css("font-size","85px");
        $(".inner-big-text").css("font-size","85px");
        text_name = "inner-text";
    }
}
function change_pre(chosen_pre){
    let pre_index = chosen_pre.getAttribute("data-id");
    reloadObj(present_list[pre_index].value,false);
    mdui.snackbar({
        message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 已应用预设',
        position: 'top'
    })
}
function custom_num(){
    let num_form = document.forms["num_form"];
    for(let o = 1;o<=3;o++){
        let numtag = "num_" + o;
        if(num_form[numtag].value == ""){
            mdui.snackbar({
                message: '<i class="mdui-icon material-icons">&#xe001;</i> 请填满所有值',
                position: 'top'
            });
            return
        }
    }
    let rangenum = [Number(num_form["num_1"].value),Number(num_form["num_2"].value)];
    rangenum = rangenum[0] > rangenum[1] ? rangenum : [rangenum[1],rangenum[0]];
    let num_foot = Number(num_form["num_3"].value);
    let num_foot_r = num_form["num_3"].value;
    if(num_foot <= 0){
        mdui.snackbar({
            message: '<i class="mdui-icon material-icons">&#xe001;</i> 步长必须大于零',
            position: 'top'
        });
        return
    }
    let picknum = rangenum[1];
    let num_list = [];
    if(String(num_foot_r).includes(".")){
        maxFloat = String(num_foot_r).length - String(num_foot_r).indexOf(".") - 1
    } else {
        maxFloat = 0
    }
    while(picknum <= rangenum[0]){
        num_list.push(String(picknum.toFixed(maxFloat)));
        picknum += num_foot
    }
    reloadObj(num_list,false);
    mdui.snackbar({
        message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 已设置为指定范围',
        position: 'top'
    })
}

window.onload = function(){
    document.getElementById("back").style.opacity = 1;
}