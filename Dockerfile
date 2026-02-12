docker run --gpus all \
    --shm-size 32g \
    -p 3000:3000 \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_TOKEN=<secret>" \
    --ipc=host \
    lmsysorg/sglang:latest \
    python3 -m sglang.launch_server \
        --model-path "argilla/distilabeled-OpenHermes-2.5-Mistral-7B" \
        --host 0.0.0.0 \
        --port 3000

# Call the server using curl (OpenAI-compatible API):
curl -X POST "http://localhost:30000/v1/chat/completions" \
	-H "Content-Type: application/json" \
	--data '{
		"model": "argilla/distilabeled-OpenHermes-2.5-Mistral-7B",
		"messages": [
			{
				"role": "user",
				"content": "What is the capital of France?"
			}
		]
	}'
