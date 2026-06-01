with open("src/components/ShipSim.tsx", "r") as f:
    lines = f.readlines()

# find {simMode === 'ship' && (
for i in range(len(lines)):
    if "{simMode === 'ship' && (" in lines[i]:
        lines[i] = "\n"
    if "      )}" in lines[i] and i > 1620 and i < 1640:
        lines[i] = "\n"
        break

with open("src/components/ShipSim.tsx", "w") as f:
    f.writelines(lines)
