from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
import numpy as np
from svd.svd_core import randomized_svd
from concurrent.futures import ThreadPoolExecutor
import io
from PIL import Image
import math

router = APIRouter()


class SVDResult(BaseModel):
    red: dict
    green: dict
    blue: dict
    width: int
    height: int


def compute_channel_svd(channel_data: np.ndarray, channel_name: str) -> dict:
    U, S, Vt = randomized_svd(channel_data, seed=42, dtype=np.float32)
    return {
        'channel': channel_name,
        'U': U.flatten().tolist(),
        'S': S.tolist(),
        'Vt': Vt.flatten().tolist()
    }

def scaleToCanvas(imgWidth, imgHeight, canvasWidth, canvasHeight):
    scale = min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    newWidth = math.floor(imgWidth * scale)
    newHeight = math.floor(imgHeight * scale)

    return (newWidth, newHeight)


#Obtains image file, gets image data
@router.post("/svd", response_model=SVDResult)
async def compute_svd_image(
    image: UploadFile = File(...)
):
    
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size
    newWidth, newHeight = scaleToCanvas(width, height, 700, 400)

    img = img.resize((newWidth, newHeight), Image.Resampling.LANCZOS)

    img_array = np.array(img, dtype=np.float32)

    red_channel = img_array[:, :, 0]
    green_channel = img_array[:, :, 1]
    blue_channel = img_array[:, :, 2]

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_red = executor.submit(compute_channel_svd, red_channel, 'red')
        future_green = executor.submit(compute_channel_svd, green_channel, 'green')
        future_blue = executor.submit(compute_channel_svd, blue_channel, 'blue')
        
        
        red_result = future_red.result()
        green_result = future_green.result()
        blue_result = future_blue.result()

    return {
        'red': {
            'U': red_result['U'],
            'S': red_result['S'],
            'Vt': red_result['Vt']
        },
        'green': {
            'U': green_result['U'],
            'S': green_result['S'],
            'Vt': green_result['Vt']
        },
        'blue': {
            'U': blue_result['U'],
            'S': blue_result['S'],
            'Vt': blue_result['Vt']
        },
        'width': newWidth,
        'height': newHeight
    }