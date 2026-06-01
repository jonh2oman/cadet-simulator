import json

with open("/Users/jonathanwaterman/.gemini/antigravity/brain/86a7e20b-b940-4b46-9783-50f35bb8a5c5/.system_generated/logs/transcript.jsonl", "r") as f:
    for line in f:
        if '"name":"multi_replace_file_content"' in line and "simMode" in line and "heliState" in line:
            obj = json.loads(line)
            for tc in obj.get("tool_calls", []):
                if tc["name"] == "multi_replace_file_content":
                    chunks = json.loads(tc["args"]["ReplacementChunks"])
                    
                    with open("src/components/ShipSim.tsx", "r") as src:
                        content = src.read()
                        
                    for chunk in chunks:
                        target = chunk["TargetContent"]
                        replacement = chunk["ReplacementContent"]
                        content = content.replace(target, replacement)
                        
                    with open("src/components/ShipSim.tsx", "w") as dst:
                        dst.write(content)
            break
