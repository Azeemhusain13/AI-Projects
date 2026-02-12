# brand_detector.py

def detect_brands(text):

    text = text.lower()

    brands_map = {
        "lenovo": "Lenovo",
        "dell": "Dell",
        "hp": "HP",
        "hewlett packard": "HP"
    }

    found = set()

    for key, brand in brands_map.items():
        if key in text:
            found.add(brand)

    return list(found)
