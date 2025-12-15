import numpy as np

def _qr_householder(A):

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

        R[k:, k:] -= tau * np.outer(w, w @ R[k:, k:])

        Q[:, k:] -= tau * np.outer(Q[:, k:] @ w, w)

    return Q[:, :n], R[:n, :]



def compute_Vt(Ub, S, B, tol=1e-12):
    l, n = B.shape
    kmax = min(len(S), n)

    Vt = np.zeros((kmax, n), dtype=B.dtype)

    # mask of valid singular values
    mask = S[:kmax] > tol
    if not np.any(mask):
        return Vt

    # scale columns of Ub by 1 / S
    Ub_scaled = Ub[:, :kmax][:, mask] / S[:kmax][mask]

    # single matrix multiply
    Vt[mask, :] = Ub_scaled.T @ B

    return Vt


def small_svd_via_eigh(B):
    """
    Returns Ub (l x l), S (min(l,n),), Vt (min(l,n) x n)
    perform eigendecomposition of B @ B^T (l x l) to obtain Ub, singular values
    """
    B = np.asarray(B, order="C")
    l, n = B.shape

    BBt = B @ B.T
    eigvals, eigvecs = np.linalg.eigh(BBt, UPLO="U")

    idx = np.argsort(eigvals)[::-1]
    eigvals = eigvals[idx]
    eigvecs = eigvecs[:, idx]
    s = eigvals.copy()

    s[s < 0] = 0
    s = np.sqrt(s)
    # Ub are eigenvecs (l x l)
    Ub = eigvecs

    # Compute Vt: for each singular vector i, v_i^T = (1/s_i) * u_i^T B
    kmax = min(l, n)
    S = s[:kmax].copy()

    Vt = compute_Vt(Ub, S, B)

    return Ub[:, :kmax], S, Vt

