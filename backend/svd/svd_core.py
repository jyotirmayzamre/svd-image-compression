from .utils import _qr_householder, small_svd_via_eigh
import numpy as np

def randomized_svd(A, p=10, q=2, seed=None, dtype=np.float32):

    A_xp = np.asarray(np.asarray(A, dtype=dtype))
    m, n = A_xp.shape
    k = min(m, n)
    l = min(k + p, k)

    rng = np.random.RandomState(seed)
    # Create random Gaussian test matrix Omega (n x l)
    Omega_cpu = rng.normal(size=(n, l)).astype(dtype)
    Omega = np.asarray(Omega_cpu)

    # sample column space Y = A @ Omega
    Y = A_xp @ Omega  # (m x l)

    # orhhonormalize Y
    Q, _ = _qr_householder(Y)  # (m x l_reduced)

    # power iterations
    for i in range(q):
        Z = A_xp.T @ Q
        Z, _ = _qr_householder(Z)
        Y = A_xp @ Z
        Q, _ = _qr_householder(Y)

    # projected small matrix B = Q^T A (l x n)
    B = Q.T @ A_xp

    Ub_small, S_all, Vt_all = small_svd_via_eigh(B)

    # expand left singular vectors
    U_full = Q @ Ub_small  # (m x l)
    k_eff = min(k, U_full.shape[1], Vt_all.shape[0])
    U = U_full[:, :k_eff]
    S = S_all[:k_eff]
    Vt = Vt_all[:k_eff, :]

    return U, S, Vt