def parse_layout(text):
    lines = text.split("\n")
    layout = {
        "top": lines[:5],
        "middle": lines[5:-5],
        "bottom": lines[-5:]
    }
    return layout
