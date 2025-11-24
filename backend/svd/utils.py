import numpy as np

def _qr(A):
    m, n = A.shape
    R = A.copy()
    Q = np.eye(m, dtype=A.dtype)

    for k in range(min(m-1, n)):
        x = R[k:, k].copy()

        # Compute Householder vector
        norm_x = np.linalg.norm(x)
        if norm_x < 1e-10:
            continue

        # Sign chosen to avoid cancellation
        s = -np.sign(x[0]) if x[0] != 0 else -1
        u1 = x[0] - s * norm_x
        w = x / u1
        w[0] = 1
        tau = -s * u1 / norm_x

        R[k:, k:] -= tau * np.outer(w, np.dot(w, R[k:, k:]))

        Q[:, k:] -= tau * np.outer(Q[:, k:] @ w, w)

    return Q[:, :n], R[:n, :]


def _eigh(mat):
    vals, vecs = np.linalg.eigh(mat)
    return vals, vecs


#  Small SVD via eigendecomposition
def small_svd_via_eigh(B):
    """
    Returns Ub (l x l), S (min(l,n),), Vt (min(l,n) x n)
    perform eigendecomposition of B @ B^T (l x l) to obtain Ub, singular values
    """
    B = np.asarray(B)
    l, n = B.shape

    BBt = B @ B.T
    eigvals, eigvecs = _eigh(BBt)

    idx = np.argsort(eigvals)[::-1]
    eigvals = eigvals[idx]
    eigvecs = eigvecs[:, idx]
    s = eigvals

    s[s < 0] = 0
    s = np.sqrt(s)
    # Ub are eigenvecs (l x l)
    Ub = eigvecs

    # Compute Vt: for each singular vector i, v_i^T = (1/s_i) * u_i^T B
    tol = 1e-12
    kmax = min(l, n)
    S = s[:kmax]
    Vt_rows = []

    for i in range(kmax):
        si = S[i]
        ui = Ub[:, i:i+1]
        if si > tol:
            vi_t = ((ui.T @ B) / si).reshape(-1)  # length  = n
        else:
            # singular is zero -> choose arbitrary orthonormal vector in nullspace
            vi_t = np.zeros(n, dtype=B.dtype)
        Vt_rows.append(vi_t)
    Vt = np.stack(Vt_rows, axis=0)  # (kmax x n)
    return Ub[:, :kmax], S, Vt

    
