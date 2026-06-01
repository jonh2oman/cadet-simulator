import json

with open("/Users/jonathanwaterman/.gemini/antigravity/brain/86a7e20b-b940-4b46-9783-50f35bb8a5c5/.system_generated/logs/transcript.jsonl", "r") as f:
    for line in f:
        if "multi_replace_file_content" in line and "simMode" in line:
            print("FOUND SIMMODE")
            obj = json.loads(line)
            for tc in obj.get("tool_calls", []):
                if tc["name"] == "multi_replace_file_content":
                    print(tc["args"]["ReplacementChunks"])
