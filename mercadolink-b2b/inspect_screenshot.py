from PIL import Image
img = Image.open('screenshot.png')
print(img.size, img.mode)
px = img.resize((10, 10)).convert('L')
print(sum(px.getdata()) / 100)
