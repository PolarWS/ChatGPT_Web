from flask import Flask, jsonify, Response, escape, request, render_template
import openai
import json

openai.api_key = "YOU_KEY"

app = Flask(__name__)
messages = []


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/get_response', methods=['POST'])
def gptBot():
    try:
        global messages
        messages = messages[-6:]
        message = escape(request.form['message'])
        messages.append({'role': 'user', 'content': message})
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo", messages=messages, stream=True)
        print(message)

        def gptBotSteam():
            for chunk in completion:
                data_dict = json.loads(json.dumps(chunk, ensure_ascii=False))
                try:
                    print(data_dict["choices"][0]["delta"]["content"], end="")
                    yield data_dict["choices"][0]["delta"]["content"]
                except:
                    yield ""
        return Response(gptBotSteam(), mimetype='text/event-stream')
    except:
        print("服务器错误")
        return Response("服务器错误", mimetype='text/event-stream')


if __name__ == '__main__':
    app.run(debug=True)
