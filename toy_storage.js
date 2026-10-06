/* Toy 云存储接入
 * 仅在 B站 Toy 入口下启用：把抽取名单保存到云存储，跟随登录态跨设备同步。
 * 非 Toy 入口（含普通网页访问）不受影响，继续使用 Cookie。
 */

// 默认名单（与 maining.js 共用）
var DEFAULT_DATA = ['大吉', '小吉', '中吉', '凶', '大凶'];

// 云存储单 value 上限 1024 字节，分块时留出余量
var CLOUD_CHUNK_BYTES = 1000;

// 当前是否处于 Toy 入口
var isToyEntry = false;

// 上一次读到的分块数量，用于覆盖保存时清理多余分片
var cloudChunkCount = 0;

// 用户在云存储就绪前是否已修改过名单
var data_dirty = false;

/* SDK 是否已加载 */
function toy_support() {
    return typeof window.toy !== 'undefined' && window.toy !== null;
}

/* 单个码点的 UTF-8 字节长度 */
function utf8_len(ch) {
    var code = ch.codePointAt(0);
    if (code < 0x80) return 1;
    if (code < 0x800) return 2;
    if (code < 0x10000) return 3;
    return 4;
}

/* 按 UTF-8 字节上限切分字符串；按码点切分，拼回即为原文 */
function split_to_chunks(str, maxBytes) {
    var chunks = [];
    var cur = '';
    var curBytes = 0;
    Array.from(str).forEach(function (ch) {
        var b = utf8_len(ch);
        if (curBytes + b > maxBytes && cur !== '') {
            chunks.push(cur);
            cur = '';
            curBytes = 0;
        }
        cur += ch;
        curBytes += b;
    });
    chunks.push(cur);
    return chunks;
}

/* 统一的错误提示 */
function toy_error_message(e, prefix) {
    var msg = prefix;
    if (e && e.type === 'http_error' && e.code === 307044) {
        msg += '：请求过于频繁，请稍后再试';
    } else if (e && e.message) {
        msg += '：' + e.message;
    }
    mdui.snackbar({
        message: '<i class="mdui-icon material-icons">&#xe001;</i> ' + msg,
        position: 'top'
    });
}

/* 页面是否在 Toy 路径下（/toy/<slug>/），作为握手超时时的兜底判据 */
function in_toy_path() {
    return /\/toy\/[^/?#]+/i.test(location.pathname);
}

/* 该错误是否意味着“当前不在 Toy 环境” */
function is_not_toy_error(e) {
    if (!e) return false;
    if (e.type === 'unsupported') return true;
    // 不在 B站 容器内时 SDK 与宿主握手会超时；
    // 但真正的 Toy 页面也可能因容器较慢而超时，故仅在不匹配 /toy/ 路径时判为非 Toy
    if (e.type === 'timeout' && /handshake/i.test(e.message || '')) {
        return !in_toy_path();
    }
    return false;
}

/* 读取云存储名单
 * 返回数组：读到的元素；返回 null：无数据或暂时读不到（未登录等）；
 * 返回 false：当前不是 Toy 入口
 */
async function load_data_from_cloud() {
    try {
        var all = await toy.getCloudStorage();
        var indexes = [];
        Object.keys(all || {}).forEach(function (k) {
            var m = /^data_(\d+)$/.exec(k);
            if (m) indexes.push(parseInt(m[1], 10));
        });
        if (indexes.length === 0) {
            cloudChunkCount = 0;
            return null;
        }
        indexes.sort(function (a, b) { return a - b; });
        cloudChunkCount = indexes.length;
        var str = indexes.map(function (i) { return all['data_' + i]; }).join('');
        if (str === '') return [];
        return str.split(',');
    } catch (e) {
        if (is_not_toy_error(e)) return false;
        return null;
    }
}

/* 把名单写入云存储（分块存储） */
async function save_data_to_cloud(list) {
    if (!isToyEntry) return;
    var str = (list || []).join(',');
    var chunks = split_to_chunks(str, CLOUD_CHUNK_BYTES);
    var items = { 'data_len': String(chunks.length) };
    for (var i = 0; i < chunks.length; i++) {
        items['data_' + i] = chunks[i];
    }
    try {
        await toy.setCloudStorage(items);
        // 覆盖保存后清理上一次多出来的分片
        if (cloudChunkCount > chunks.length) {
            var stale = [];
            for (var j = chunks.length; j < cloudChunkCount; j++) {
                stale.push('data_' + j);
            }
            if (stale.length) await toy.removeCloudStorage(stale);
        }
        cloudChunkCount = chunks.length;
    } catch (e) {
        toy_error_message(e, '保存到云存储失败');
    }
}

/* 执行清除云存储并重置名单 */
async function do_clear_cloud_storage() {
    var keys = ['data_len'];
    for (var i = 0; i < cloudChunkCount; i++) {
        keys.push('data_' + i);
    }
    try {
        await toy.removeCloudStorage(keys);
    } catch (e) {
        toy_error_message(e, '清除云存储失败');
        return;
    }
    cloudChunkCount = 0;
    // 同时清掉本地 Cookie，避免下次进入时又被迁移回云端
    document.cookie = 'data=;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    reloadObj(DEFAULT_DATA.slice(), false);
    mdui.snackbar({
        message: '<i class="mdui-icon material-icons">&#xe5ca;</i> 已清除云存储，名单已恢复默认',
        position: 'top'
    });
}

var clear_confirm_pending = false;
var clear_confirm_timer = null;

/* 恢复「清除云存储」按钮的初始状态 */
function reset_clear_button() {
    clear_confirm_pending = false;
    if (clear_confirm_timer) {
        clearTimeout(clear_confirm_timer);
        clear_confirm_timer = null;
    }
    var btn = document.getElementById('clear-cloud-button');
    if (btn) {
        btn.textContent = '清除云存储';
        btn.classList.remove('clear-button-confirm');
    }
}

/* 清除云存储：第一次点击需再点一次确认，避免误触 */
function clear_cloud_storage() {
    if (!isToyEntry) return;
    var btn = document.getElementById('clear-cloud-button');
    if (!clear_confirm_pending) {
        clear_confirm_pending = true;
        if (btn) {
            btn.textContent = '再点一次确认清除';
            btn.classList.add('clear-button-confirm');
        }
        clear_confirm_timer = setTimeout(reset_clear_button, 3000);
        return;
    }
    reset_clear_button();
    do_clear_cloud_storage();
}

/* 获取/刷新当前登录用户信息，fromGesture 表示由用户点击触发 */
async function refresh_user_profile(fromGesture) {
    if (!toy_support()) return;
    var nameEl = document.getElementById('user-name');
    var loginBtn = document.getElementById('user-login-button');
    try {
        var profile = await toy.getUserProfile();
        var avatar = document.getElementById('user-avatar');
        if (profile && profile.avatar && avatar) avatar.src = profile.avatar;
        if (nameEl) nameEl.textContent = (profile && profile.nickname) ? profile.nickname : '已登录';
        if (loginBtn) loginBtn.style.display = 'none';
    } catch (e) {
        if (nameEl) nameEl.textContent = '未获取用户信息';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (fromGesture) toy_error_message(e, '获取用户信息失败');
    }
}

/* 初始化：判断是否 Toy 入口，显示用户卡片并加载云端名单 */
async function init_toy() {
    if (!toy_support()) return;
    var supported = false;
    try {
        supported = await toy.isSupport('getCloudStorage');
    } catch (e) {
        supported = false;
    }
    if (!supported) return;

    var cloud_data = await load_data_from_cloud();
    if (cloud_data === false) return; // 已确认不在 Toy 入口

    isToyEntry = true;

    var card = document.getElementById('user-card');
    if (card) card.style.display = 'flex';

    refresh_user_profile(false);

    if (data_dirty) {
        // 云存储就绪前用户已改过名单，以本地为准补写上去
        save_data_to_cloud(full_data);
    } else if (cloud_data && cloud_data.length) {
        reloadObj(cloud_data, false);
    } else if (getCookie('data') !== '') {
        // 首次接入：把原本存在 Cookie 里的名单迁移到云存储
        save_data_to_cloud(full_data);
    }
}

window.addEventListener('load', function () {
    init_toy();
});
