use wasm_bindgen::prelude::*;
use js_sys::Float32Array;

#[wasm_bindgen]
pub fn reconstruct(
    r: Float32Array,
    g: Float32Array,
    b: Float32Array,
    width: u32,
    height: u32,
) -> Float32Array {
    let total_pixels = (width * height) as usize;
    
    let r_vec = r.to_vec();
    let g_vec = g.to_vec();
    let b_vec = b.to_vec();
    
    let mut output_vec = vec![0f32; total_pixels * 4];
    for i in 0..total_pixels {
        let idx = i * 4;
        output_vec[idx]     = r_vec[i];
        output_vec[idx + 1] = g_vec[i];
        output_vec[idx + 2] = b_vec[i];
        output_vec[idx + 3] = 255.0;
    }
    
    let output = Float32Array::new_with_length((total_pixels * 4) as u32);
    output.copy_from(&output_vec);
    
    output
}


#[wasm_bindgen]
pub fn reconstruct_channel(
    u: Float32Array,
    s: Float32Array,
    vt: Float32Array,
    width: u32,
    height: u32,
    rank: u32
) -> Float32Array {
    let m = height as usize;
    let n = width as usize;
    let rank = rank as usize;
    let full_rank = m.min(n);

    let u_vec = u.to_vec();
    let s_vec = s.to_vec();
    let vt_vec = vt.to_vec();

    let mut result = vec![0.0_f32; m * n];

    for i in 0..m {
        let u_row_offset = i * full_rank;
        let result_row_offset = i * n;

        for j in 0..n {
            let mut sum = 0.0;
            for t in 0..rank {
                sum += u_vec[u_row_offset + t] * s_vec[t] * vt_vec[t * n + j];
            }
            result[result_row_offset + j] = sum;
        }
    }

    let output = Float32Array::new_with_length((m * n) as u32);
    output.copy_from(&result);
    
    output
}
