if ($.cookie('headerData') === undefined) {
    $.cookie('headerData', '');
} else {
    $('#headerData').val($.cookie('headerData'));
}
if ($.cookie('firstData') === undefined) {
    $.cookie('firstData', '');
} else {
    $('#firstData').val($.cookie('firstData'));
}



const cardBody = $(".card-body");
var windowHeight = window.innerHeight;
const headerHeight = 10;
const chatWindow = $("#chat-window");
const messageForm = $("#message-form");
var cardBodyHeight = windowHeight - headerHeight * 3.5;

var fontSize = parseInt(cardBody.width() / 10);
var fontSize2 = parseInt(cardBody.width() / 40);

if (fontSize < 80) {
    fontSize = parseInt(cardBody.width() / 6);
    fontSize2 = parseInt(cardBody.width() / 22);
    $("#chatgptText").css("margin-top", parseInt(windowHeight / 12) + "px");
    $("#chatText").css("margin-left", parseInt(fontSize / 4) + "px");
    messageForm.css("margin-top", parseInt(fontSize / 2) + "px");
    cardBody.css("padding", parseInt(fontSize / 2) + "px");
} else {
    $("#chatgptText").css("margin-top", parseInt(windowHeight / 25) + "px");
    $("#chatText").css("margin-left", parseInt(fontSize / 3) + "px");
    messageForm.css("margin-top", parseInt(fontSize / 2) + "px");
    cardBody.css("padding", parseInt(fontSize / 2) + "px");
}

$("#chatgptText").css("font-size", fontSize + "px");
$("#chatText").css("font-size", fontSize2 + "px");


const messageInput = $("#message-input");
const txtbox = $("#headerData, #firstData");
const stopbut = $("#stopbut");
const clearBtn = $('#clear-btn');
const submit = $('#submit');
const myProgressBar = $("#myProgressBar");
let chatgptLi = $("#chatgptLi").height();
let originalHeight = messageInput.height();
let headerData = $("#headerData").val();
let firstData = $("#firstData").val();
let sendControl = true;
let stopsend = false;
let messages = [{ 'role': 'user', 'content': firstData }];

stopbut.hide();
myProgressBar.hide();

window.addEventListener("resize", function () {
    windowHeight = window.innerHeight;
    cardBodyHeight = windowHeight - headerHeight * 3.5;
    autobox(false);
});

window.addEventListener('resize', function () {
    fontSize = parseInt(cardBody.width() / 10);
    fontSize2 = parseInt(cardBody.width() / 40);
    if (fontSize < 80) {
        fontSize = parseInt(cardBody.width() / 6);
        fontSize2 = parseInt(cardBody.width() / 22);
        $("#chatgptText").css("margin-top", parseInt(windowHeight / 12) + "px");
        $("#chatText").css("margin-left", parseInt(fontSize / 4) + "px");
        messageForm.css("margin-top", parseInt(fontSize / 2) + "px");
        cardBody.css("padding", parseInt(fontSize / 2) + "px");
    } else {
        $("#chatgptText").css("margin-top", parseInt(windowHeight / 25) + "px");
        $("#chatText").css("margin-left", parseInt(fontSize / 3) + "px");
        messageForm.css("margin-top", parseInt(fontSize / 2) + "px");
        cardBody.css("padding", parseInt(fontSize / 2) + "px");
    }
    $("#chatgptText").css("font-size", fontSize + "px");
    $("#chatText").css("font-size", fontSize2 + "px");
});

window.onload = function () {
    autobox();
}

$("#setSave").on('click', function () {
    headerData = $("#headerData").val();
    firstData = $("#firstData").val();
    messages[0].content = $("#firstData").val();
    $.cookie('headerData', headerData);
    $.cookie('firstData', firstData);
});

messageInput.on('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight + 5) + 'px';
    autobox(false);
}).trigger('input');

txtbox.height(100);

messageInput.keydown(function (event) {
    if (event.keyCode == 13 && !event.shiftKey && sendControl) {
        event.preventDefault();
        submit.click();
    }
});

stopbut.on('click', function (event) {
    event.preventDefault();
    submit.prop('disabled', false);
    stopbut.hide();
    myProgressBar.hide();
    sendControl = true;
    stopsend = true;
});

submit.on('click', function (event) {
    event.preventDefault();
    const message = messageInput.val();
    messageInput.height(originalHeight);

    if (!message) { return; }
    else if (message == "q" || message == "Q") {
        messages = [{ 'role': 'user', 'content': firstData }];
        messageInput.val('');
        chatWindow.empty();
        autobox();
        return;
    } else if (message == "s" || message == "S") {
        messageInput.val('');
        autobox();
        $('#exampleModal').modal('show')
        return;
    }

    messages = messages.slice(-6);
    messages[0].content = firstData;
    messages.push({ 'role': 'user', 'content': headerData + message });
    console.log(messages);

    submit.prop('disabled', true);
    chatWindow.append("<li class='list-group-item bg-light border-0'><p><b>我:</b></p>" + $("<div>").text(message).html() + "</li>").hide().fadeIn();
    autobox();
    sendControl = false;
    myProgressBar.show();
    stopbut.show();
    messageInput.val("");

    fetch('/get_response', {
        method: 'POST',
        body: new URLSearchParams({
            'message': message,
            'messages': JSON.stringify(messages)
        })
    })
        .then(response => {
            if (stopsend) { return; }
            const reader = response.body.getReader();
            let decoder = new TextDecoder("utf-8");
            let result = '';
            let msgMd = '';
            let answer = randomString(16);

            const md = new markdownit({
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try { return hljs.highlight(lang, str).value; }
                        catch (__) { }
                    }
                    return "";
                },
            });

            chatWindow.append("<li class='list-group-item border-0'' id='" + answer + "'><b class='text-primary'>ChatGPT:</b></li>").hide().fadeIn();

            reader.read().then(function processText({ done, value }) {
                if (done) {
                    divideKatex(msgMd, answer);
                    submit.prop('disabled', false);
                    stopbut.hide();
                    myProgressBar.hide();
                    sendControl = true;
                    return;
                }

                if (stopsend) { return; }

                result = decoder.decode(value);
                const messages = result.split('');
                messages.forEach(msg => {
                    msgMd += msg;
                    divideKatex(msgMd, answer);
                });
                result = messages.pop();
                reader.read().then(processText);
            });
        })
        .catch(error => {
            chatWindow.append("<li class='list-group-item border-0'><b>发送消息失败</b></li>").hide().fadeIn();
            autobox();
            submit.prop('disabled', false);
            stopbut.hide();
            myProgressBar.hide();
            sendControl = true;
        });

    stopsend = false;
});

function divideKatex(str, answer) {
    const md = new markdownit({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try { return hljs.highlight(lang, str).value; }
                catch (__) { }
            }
            return "";
        },
    });
    const regex = /(\$+.*?\$+)|\\\(.*?\\\)/g;
    const segments = str.split(regex); // 分割文本段
    let renderPage = "";
    let katecot = false;
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i % 2 === 0) { // 不是匹配的文本段
            renderPage += md.render(" " + segment); // 直接渲染Markdown
        } else { // 匹配的文本段
            try {
                const katexStr = segment.replace(/\$/g, "").replace(/\\/g, "\\"); // 去除\
                renderPage += katex.renderToString(katexStr); // 用KaTeX渲染
                katecot = true;
            } catch {
                renderPage += md.render(segment); // 直接渲染Markdown
            }
        }
    }
    if (katecot) {
        $('#' + answer).html("<p class='text-primary'><b>ChatGPT:</b></p> " + renderPage.replace(/<\/?p>/gi, ""));
    } else {
        $('#' + answer).html("<p class='text-primary'><b>ChatGPT:</b></p> " + renderPage);
    }
    autobox();
}

function autobox(winscr = true) {
    if (winscr) {
        if (chatWindow.height() + messageForm.height() >= cardBodyHeight - chatgptLi - fontSize * 1.5) {
            boxAuto = chatWindow.height() + messageForm.height() + chatgptLi + headerHeight * 15;
            cardBody.css("height", boxAuto + "px");
            cardBody.css("margin-bottom", fontSize / 4 + "px");
            window.scrollTo(0, document.body.scrollHeight);
        } else {
            cardBody.css("height", cardBodyHeight + "px");
            cardBody.css("margin-bottom", "0px");
            window.scrollTo(0, document.body.scrollHeight);
        }
    } else {
        if (chatWindow.height() + messageForm.height() >= cardBodyHeight - chatgptLi - fontSize * 1.5) {
            boxAuto = chatWindow.height() + messageForm.height() + chatgptLi + headerHeight * 15;
            cardBody.css("height", boxAuto + "px");
            cardBody.css("margin-bottom", fontSize / 4 + "px");
        } else {
            cardBody.css("height", cardBodyHeight + "px");
            cardBody.css("margin-bottom", "0px");
        }
    }
}

function randomString(len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}