from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
from svd.svd_core import randomized_svd


router = APIRouter()

class MatrixPayload(BaseModel):
    width: int
    height: int
    data: list[list[float]]
    channels: dict


@router.post("/svd")
def compute_svd_api(payload: MatrixPayload):
    results = {}

    matrix = np.array(payload.data, dtype=float).reshape(payload.height, payload.width)
    U, S, Vt = randomized_svd(matrix, seed=42, dtype=np.float32)

    results = {
        "U": U.tolist(),
        "S": S.tolist(),
        "Vt": Vt.tolist(),
    }
    return results