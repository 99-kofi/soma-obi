from gradio_client import Client

print("Connecting to Qwen...")
try:
    client = Client("Qwen/Qwen2.5-72B-Instruct")
    result = client.predict(
        query="Hello",
        history=[],
        system="You are a helpful assistant.",
        api_name="/model_chat"
    )
    print("Success:", result)
except Exception as e:
    print("Qwen Failed:", e)

print("Connecting to Zephyr...")
try:
    client = Client("HuggingFaceH4/zephyr-7b-beta")
    result = client.predict(
        "Hello",
        "", # system prompt
        [], # history
        api_name="/chat"
    )
    print("Success:", result)
except Exception as e:
    print("Zephyr Failed:", e)
