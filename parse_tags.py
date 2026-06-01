import re

with open("src/components/ShipSim.tsx", "r") as f:
    lines = f.readlines()

tags = []
for i, line in enumerate(lines):
    if i < 1317 or i > 1629: continue # only modern ship control panel
    
    # Very naive regex
    open_tags = re.findall(r'<div[^>]*>', line)
    close_tags = re.findall(r'</div', line)
    
    for _ in open_tags: tags.append(('div', i+1))
    for _ in close_tags:
        if tags:
            tags.pop()
        else:
            print(f"Extra closing tag at {i+1}")

print(f"Remaining open tags: {tags}")
