"""
This file contains functions that convert the results coming out of runpf() into
readable/usable metrics.
The main body of this code (printpf()) was ported from PYPOWER/pypower/printpf.py.
The metrics came from https://github.com/rfairley/pcc-web/blob/master/flask-api/pcc/calc.py.
"""

from sys import stdout

from numpy import \
    ones, zeros, r_, sort, exp, pi, diff, arange, min, \
    argmin, argmax, logical_or, real, imag, any, hstack

from numpy import flatnonzero as find

from pypower.idx_bus import BUS_I, BUS_TYPE, PD, QD, GS, BS, BUS_AREA, \
    VM, VA, VMAX, VMIN, LAM_P, LAM_Q, MU_VMAX, MU_VMIN, REF
from pypower.idx_gen import GEN_BUS, PG, QG, QMAX, QMIN, GEN_STATUS, \
    PMAX, PMIN, MU_PMAX, MU_PMIN, MU_QMAX, MU_QMIN
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

from pypower.isload import isload
from pypower.run_userfcn import run_userfcn
from pypower.ppoption import ppoption

'''
pf_metrics:
- f
- load
- tranmission
- loss
'''
# NOTE: All indices out of this function will be zero-based.
def convert_to_metrics(baseMVA, bus=None, gen=None, branch=None, f=None, success=None,
            et=None, fd=None, ppopt=None):
    """Prints power flow results.
    Prints power flow and optimal power flow results to C{fd} (a file
    descriptor which defaults to C{stdout}), with the details of what
    gets printed controlled by the optional C{ppopt} argument, which is a
    PYPOWER options vector (see L{ppoption} for details).
    The data can either be supplied in a single C{results} dict, or
    in the individual arguments: C{baseMVA}, C{bus}, C{gen}, C{branch}, C{f},
    C{success} and C{et}, where C{f} is the OPF objective function value,
    C{success} is C{True} if the solution converged and C{False} otherwise,
    and C{et} is the elapsed time for the computation in seconds. If C{f} is
    given, it is assumed that the output is from an OPF run, otherwise it is
    assumed to be a simple power flow run.
    Examples::
        ppopt = ppoptions(OUT_GEN=1, OUT_BUS=0, OUT_BRANCH=0)
        fd = open(fname, 'w+b')
        results = runopf(ppc)
        printpf(results)
        printpf(results, fd)
        printpf(results, fd, ppopt)
        printpf(baseMVA, bus, gen, branch, f, success, et)
        printpf(baseMVA, bus, gen, branch, f, success, et, fd)
        printpf(baseMVA, bus, gen, branch, f, success, et, fd, ppopt)
        fd.close()
    @author: Ray Zimmerman (PSERC Cornell)
    """
    pf_metrics = {}

    ##----- initialization -----
    ## default arguments
    assert(isinstance(baseMVA, dict))
    if isinstance(baseMVA, dict):
        have_results_struct = 1
        results = baseMVA
        if gen is None:
            ppopt = ppoption()   ## use default options
        else:
            ppopt = gen
        if (ppopt['OUT_ALL'] == 0):
            return     ## nothin' to see here, bail out now
        if bus is None:
            fd = stdout         ## print to stdout by default
        else:
            fd = bus
        baseMVA, bus, gen, branch, success, et = \
            results["baseMVA"], results["bus"], results["gen"], \
            results["branch"], results["success"], results["et"]
        if 'f' in results:
            f = results["f"]
        else:
            f = None
    '''
    else:
        have_results_struct = 0
        if ppopt is None:
            ppopt = ppoption()   ## use default options
            if fd is None:
                fd = stdout         ## print to stdout by default
        if ppopt['OUT_ALL'] == 0:
            return     ## nothin' to see here, bail out now
    '''

    isOPF = f is not None    ## FALSE -> only simple PF data, TRUE -> OPF data
    pf_metrics["cost"] = f
    pf_metrics["passed"] = results["success"] == 1

    ## options
    isDC            = ppopt['PF_DC']        ## use DC formulation?
    OUT_ALL         = ppopt['OUT_ALL']
    OUT_ANY         = OUT_ALL == 1     ## set to true if any pretty output is to be generated
    OUT_SYS_SUM     = (OUT_ALL == 1) or ((OUT_ALL == -1) and ppopt['OUT_SYS_SUM'])
    OUT_AREA_SUM    = (OUT_ALL == 1) or ((OUT_ALL == -1) and ppopt['OUT_AREA_SUM'])
    OUT_BUS         = (OUT_ALL == 1) or ((OUT_ALL == -1) and ppopt['OUT_BUS'])
    OUT_BRANCH      = (OUT_ALL == 1) or ((OUT_ALL == -1) and ppopt['OUT_BRANCH'])
    OUT_GEN         = (OUT_ALL == 1) or ((OUT_ALL == -1) and ppopt['OUT_GEN'])
    OUT_ANY         = OUT_ANY | ((OUT_ALL == -1) and
                        (OUT_SYS_SUM or OUT_AREA_SUM or OUT_BUS or
                         OUT_BRANCH or OUT_GEN))

    if OUT_ALL == -1:
        OUT_ALL_LIM = ppopt['OUT_ALL_LIM']
    elif OUT_ALL == 1:
        OUT_ALL_LIM = 2
    else:
        OUT_ALL_LIM = 0

    OUT_ANY         = OUT_ANY or (OUT_ALL_LIM >= 1)
    if OUT_ALL_LIM == -1:
        OUT_V_LIM       = ppopt['OUT_V_LIM']
        OUT_LINE_LIM    = ppopt['OUT_LINE_LIM']
        OUT_PG_LIM      = ppopt['OUT_PG_LIM']
        OUT_QG_LIM      = ppopt['OUT_QG_LIM']
    else:
        OUT_V_LIM       = OUT_ALL_LIM
        OUT_LINE_LIM    = OUT_ALL_LIM
        OUT_PG_LIM      = OUT_ALL_LIM
        OUT_QG_LIM      = OUT_ALL_LIM

    OUT_ANY         = OUT_ANY or ((OUT_ALL_LIM == -1) and (OUT_V_LIM or OUT_LINE_LIM or OUT_PG_LIM or OUT_QG_LIM))
    ptol = 1e-4        ## tolerance for displaying shadow prices

    ## create map of external bus numbers to bus indices
    i2e = bus[:, BUS_I].astype(int)
    e2i = zeros(max(i2e) + 1, int)
    e2i[i2e] = arange(bus.shape[0])

    ## sizes of things
    nb = bus.shape[0]      ## number of buses
    nl = branch.shape[0]   ## number of branches
    ng = gen.shape[0]      ## number of generators

    ## zero out some data to make printout consistent for DC case
    if isDC:
        bus[:, r_[QD, BS]]          = zeros((nb, 2))
        gen[:, r_[QG, QMAX, QMIN]]  = zeros((ng, 3))
        branch[:, r_[BR_R, BR_B]]   = zeros((nl, 2))

    # see how much power is given to each bus, and generated at each bus; 
    # output: node_count x 4
    pf_metrics["buses"] = zeros((nb, 4))
    pf_metrics["buses"][:, :2] = bus[:, [VM, VA]]
    for gen_node in gen:
        node = int(gen_node[GEN_BUS]) - 1
        pf_metrics["buses"][node, 2] = gen_node[PG]
        pf_metrics["buses"][node, 3] = gen_node[QG]

    # see how much power is transmitted through each line
    pf_metrics["transmissions"] = [{
            'from':             int(branch[i, F_BUS]) - 1, 
            'to':               int(branch[i, T_BUS]) - 1, 
            'real_power':       branch[i, PF],
            'reactive_power':   branch[i, QF]} for i in range(nl)]

    ## parameters
    ties = find(bus[e2i[branch[:, F_BUS].astype(int)], BUS_AREA] !=
                   bus[e2i[branch[:, T_BUS].astype(int)], BUS_AREA])
                            ## area inter-ties
    tap = ones(nl)                           ## default tap ratio = 1 for lines
    xfmr = find(branch[:, TAP])           ## indices of transformers
    tap[xfmr] = branch[xfmr, TAP]            ## include transformer tap ratios
    tap = tap * exp(-1j * pi / 180 * branch[:, SHIFT]) ## add phase shifters
    nzld = find((bus[:, PD] != 0.0) | (bus[:, QD] != 0.0))
    sorted_areas = sort(bus[:, BUS_AREA])
    ## area numbers
    s_areas = sorted_areas[r_[1, find(diff(sorted_areas)) + 1]]
    nzsh = find((bus[:, GS] != 0.0) | (bus[:, BS] != 0.0))
    allg = find( ~isload(gen) )
    ong  = find( (gen[:, GEN_STATUS] > 0) & ~isload(gen) )
    onld = find( (gen[:, GEN_STATUS] > 0) &  isload(gen) )
    V = bus[:, VM] * exp(-1j * pi / 180 * bus[:, VA])
    out = find(branch[:, BR_STATUS] == 0)        ## out-of-service branches
    nout = len(out)
    if isDC:
        loss = zeros(nl)
    else:
        loss = baseMVA * abs(V[e2i[ branch[:, F_BUS].astype(int) ]] / tap -
                             V[e2i[ branch[:, T_BUS].astype(int) ]])**2 / \
                    (branch[:, BR_R] - 1j * branch[:, BR_X])

    pf_metrics["loss"] = sum(real(loss)) 
    return pf_metrics


