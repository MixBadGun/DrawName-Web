//导出
function export_txt() {
    texting = "";
    ul = document.getElementById("info-box").children;
    for (var i=0;i<total_times;i++) {
        texting += `${ul[i].children[0].innerHTML}\t${ul[i].children[1].innerHTML}\n`;
    };
    exportRaw(texting, "抽取名单.txt");
}
function exportRaw(data, name) {
    var urlObject = window.URL || window.webkitURL || window;
    var export_blob = new Blob([data]);
    var save_link = document.createElement("a");
    save_link.href = urlObject.createObjectURL(export_blob);
    save_link.download = name;
    save_link.click();
}