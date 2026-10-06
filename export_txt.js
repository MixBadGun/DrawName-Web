//取抽取结果文本（序号 + Tab + 名字），导出与复制共用
function get_result_text() {
    let texting = "";
    let ul = document.getElementById("info-box").children;
    for (let i=0;i<total_times;i++) {
        if (!ul[i]) break;
        texting += `${ul[i].children[0].innerHTML}\t${ul[i].children[1].innerHTML}\n`;
    };
    return texting;
}
//导出
function export_txt() {
    exportRaw(get_result_text(), "抽取名单.txt");
}
function exportRaw(data, name) {
    var urlObject = window.URL || window.webkitURL || window;
    var export_blob = new Blob([data]);
    var save_link = document.createElement("a");
    save_link.href = urlObject.createObjectURL(export_blob);
    save_link.download = name;
    save_link.click();
}