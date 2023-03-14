from flask import Flask, jsonify, Response, escape, request, render_template
import openai
import json

# 设置OpenAI密钥和服务器端口
openai.api_key = "YOU_KEY"   # 将此处的YOU_KEY替换为您的密钥
serverPort = "PORT"          # 将此处的PORT替换为您需要的端口号

# 初始化Flask应用程序实例
app = Flask(__name__)

# 定义一个空数组变量messages
messages = []


@app.route('/')      # 定义根路由，并渲染模板index.html
def home():
    return render_template('index.html')


# 定义路由'/get_response'，并获取POST请求发送过来的数据
@app.route('/get_response', methods=['POST'])
def gptBot():
    try:
        global messages
        # 把request.form['messages']转化成json对象
        messages = json.loads(request.form['messages'])
        message = escape(request.form['message'])                 # 防止XXS攻击
        completion = openai.ChatCompletion.create(                 # 调用OpenAI聊天接口
            model="gpt-3.5-turbo",                               # 使用GPT-3.5-turbo模型
            messages=messages,
            stream=True
        )
        print(message)

        # 声明一个生成器函数
        def gptBotSteam():
            for chunk in completion:
                data_dict = json.loads(json.dumps(chunk, ensure_ascii=False))
                try:
                    yield data_dict["choices"][0]["delta"]["content"]
                except:
                    yield ""

        # 返回结果给服务器
        return Response(gptBotSteam(), mimetype='text/event-stream')

    except:
        print("服务器错误")
        return Response("服务器错误", mimetype='text/event-stream')


# 如果当前脚本是主程序，则运行Flask应用程序
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=serverPort)
