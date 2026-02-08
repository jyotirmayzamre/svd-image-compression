# SVD Image Compression

A web-based application for compressing images using Singular Value Decomposition (SVD) with a modern frontend interface (using Web Assembly and web workers) and high-performance backend processing. This project was done by me and Anurav Singh for the course Numerical Algorithms and Optimization.

## Overview

This project implements image compression using Singular Value Decomposition. By retaining only the most significant singular values, the algorithm achieves compression while maintaining visual quality.

## Project Structure

- **Frontend**: TypeScript-based web interface for image upload and visualization
- **Backend**: FastAPI server handling image uploads and multithreaded SVD (for colour channels)
- **SVD Library**: Rust-based core library providing functions for matrix reconstruction from SVD

## Algorithm

Singular Value Decomposition factorizes an image matrix **A** into three matrices:

```
A = U Σ V^T
```

Where:
- **U** contains left singular vectors
- **Σ** is a diagonal matrix of singular values
- **V^T** contains right singular vectors

The compression is achieved by truncating the decomposition to rank *k*, retaining only the *k* largest singular values and their corresponding vectors. This produces an approximation **A_k** that requires significantly less storage while preserving the essential features of the original image.

For color images, the algorithm processes each RGB channel independently, applying SVD to the red, green, and blue components separately before recombining them. We have implemented a randomized SVD algorithm.


## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- Rust 1.70+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --workers 3
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### SVD Library Build

```bash
cd svd_lib
wasm-pack build --target web
cp svd_lib/pkg/svd_lib_bg.wasm frontend/public/
```

## Usage

1. Access the web interface at `http://localhost:5173`
2. Upload an image using the file selector
3. Adjust the compression level using the rank slider
4. View the compressed result and compression statistics

## To-Do

- Rewrite core SVD utils to use a more efficient algorithm
- Add features like view against original, more metrics like Frobenius error, etc
