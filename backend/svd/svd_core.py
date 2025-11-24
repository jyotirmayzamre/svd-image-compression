from utils import _asarray_module, _dot, _qr, small_svd_via_eigh
import numpy as np

def randomized_svd(A, p=10, q=2, seed=None, dtype=np.float32):

    xp = np
    m, n = A.shape

    k = min(m, n)

    A_xp = _asarray_module(np.asarray(A, dtype=dtype))
    m, n = A_xp.shape
    l = min(k + p, min(m, n))

    rng = np.random.RandomState(seed)
    # Create random Gaussian test matrix Omega (n x l)
    Omega_cpu = rng.normal(size=(n, l)).astype(dtype)
    Omega = _asarray_module(Omega_cpu)

    # sample column space Y = A @ Omega
    Y = _dot(A_xp, Omega)  # (m x l)

    # orhhonormalize Y
    Q, _ = _qr(Y)  # (m x l_reduced)

    # power iterations
    for i in range(q):
        Z = _dot(A_xp.T, Q)
        Z, _ = _qr(Z)
        Y = _dot(A_xp, Z)
        Q, _ = _qr(Y)

    # projected small matrix B = Q^T A (l x n)
    B = _dot(Q.T, A_xp)

    Ub_small, S_all, Vt_all = small_svd_via_eigh(B)

    # expand left singular vectors
    U_full = _dot(Q, Ub_small)  # (m x l)
    k_eff = min(k, U_full.shape[1], Vt_all.shape[0])
    U = U_full[:, :k_eff]
    S = S_all[:k_eff]
    Vt = Vt_all[:k_eff, :]

    U_cpu = np.asarray(U)
    S_cpu = np.asarray(S)
    Vt_cpu = np.asarray(Vt)

    return U_cpu, S_cpu, Vt_cpu