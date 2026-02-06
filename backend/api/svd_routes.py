from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response
import numpy as np
from svd.svd_core import randomized_svd
from concurrent.futures import ProcessPoolExecutor
import io
from PIL import Image
import asyncio

router = APIRouter()
executor = ProcessPoolExecutor(max_workers=3)


def compute_channel_svd(channel_data: np.ndarray, channel_name: str) -> dict:
    U, S, Vt = randomized_svd(channel_data, seed=42, dtype=np.float32)
    return {
        'channel': channel_name,
        'U': U.astype(np.float32).ravel(),
        'S': S.astype(np.float32),
        'Vt': Vt.astype(np.float32).ravel()
    }




#Obtains image file, gets image data
@router.post("/svd")
async def compute_svd_image(
    image: UploadFile = File(...)
):
    
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(img, dtype=np.float32)


    loop = asyncio.get_running_loop()

    red_f = loop.run_in_executor(executor, compute_channel_svd, img_array[:, :, 0], 'red')
    green_f = loop.run_in_executor(executor, compute_channel_svd, img_array[:, :, 1], 'green')
    blue_f = loop.run_in_executor(executor, compute_channel_svd, img_array[:, :, 2], 'blue')


    red_result, green_result, blue_result = await asyncio.gather(
        red_f, green_f, blue_f
    )

    buffer = io.BytesIO()

    for result in [red_result, green_result, blue_result]:
        
        buffer.write(result["U"].tobytes())
        buffer.write(result["S"].tobytes())
        buffer.write(result["Vt"].tobytes())

    buffer.seek(0)
    
    return Response(
        content=buffer.read(),
        media_type='application/octet-stream'
    )