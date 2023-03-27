from flask import Flask, Response, escape, request, render_template, send_from_directory
import os
import openai
import json
from datetime import datetime

# 设置OpenAI密钥和服务器端口
openai.api_key = "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"   # 将此处的YOU_KEY替换为您的密钥
serverPort = "7788"          # 将此处的PORT替换为您需要的端口号

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/js/chatgptweb.js')
def chatgptwebjs():
    return render_template('./js/chatgptweb.js')

# 设置站点 favicon.ico
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/get_response', methods=['POST'])
def gptBot():
    # try:
    now1 = datetime.now()
    messages = json.loads(request.form['messages'])
    message = escape(request.form['message'])
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo", messages=messages, stream=True)

    def gptBotSteam():
        for chunk in completion:
            data_dict = json.loads(json.dumps(chunk, ensure_ascii=False))
            try:
                yield data_dict["choices"][0]["delta"]["content"]
            except:
                yield ""

    now2 = datetime.now()
    print("[" + now1.strftime("%d/%m/%Y %H:%M:%S") + "]" + "--["+ now2.strftime("%d/%m/%Y %H:%M:%S") + "]" + message)
    return Response(gptBotSteam(), mimetype='text/event-stream')
    # except:
    #     print("服务器错误")
    #     return Response("服务器错误,请重试", mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=serverPort)
