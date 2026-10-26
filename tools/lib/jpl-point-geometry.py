"""Independent vector geometry for JPL DE441 nodes and lunar apogee.

No Swiss positional routines are used. Coordinates are from the supplied JPL
SPK; frame rotations are ERFA IAU 2006 and nutation IAU 2000B. Time conversion
is supplied by the caller so TT/UT conventions are explicit and reproducible.
"""
import numpy as np
import erfa
from jplephem.spk import SPK
AU = 149597870.7
MU_EARTH_MOON = (398600.435436 + 4902.800066) * 86400**2 / AU**3
PLANETS = dict(Mercury=1, Venus=2, Mars=4, Jupiter=5, Saturn=6, Uranus=7, Neptune=8, Pluto=9)
class Geometry:
    def __init__(self, kernel): self.kernel = SPK.open(str(kernel))
    def orientation(self, tt):
        tt = np.asarray(tt)
        return erfa.ecm06(2451545.0, tt - 2451545.0), erfa.nut00b(2451545.0, tt - 2451545.0)[0]
    @staticmethod
    def longitude(vector, rotation, nutation):
        v = np.einsum('...ij,j...->i...', rotation, vector)
        return (np.degrees(np.arctan2(v[1], v[0]) + nutation)) % 360
    def apogee(self, tt):
        mr,mv = self.kernel[3,301].compute_and_differentiate(tt)
        er,ev = self.kernel[3,399].compute_and_differentiate(tt)
        r, v = (mr-er)/AU, (mv-ev)/AU
        h = np.cross(r.T,v.T).T
        eccentricity = np.cross(v.T,h.T).T/MU_EARTH_MOON-r/np.linalg.norm(r,axis=0)
        rotation, nutation = self.orientation(tt)
        return self.longitude(-eccentricity, rotation, nutation)
    def node(self, name, tt):
        pr,pv = self.kernel[0,PLANETS[name]].compute_and_differentiate(tt)
        sr,sv = self.kernel[0,10].compute_and_differentiate(tt)
        r,v = (pr-sr)/AU,(pv-sv)/AU
        rotation,nutation = self.orientation(tt)
        # Swiss constructed-point convention starts from dynamical J2000
        # coordinates. Make that frame-bias rotation explicit before the
        # IAU ecliptic-of-date rotation. This is a coordinate convention,
        # not an epoch-specific adjustment fitted to a chart.
        rotation = np.einsum('...ij,jk->...ik', rotation, erfa.bp06(2451545.0, 0.0)[0])
        r = np.einsum('...ij,j...->i...', rotation,r)
        v = np.einsum('...ij,j...->i...', rotation,v)
        h = np.cross(r.T,v.T).T
        return np.degrees(np.arctan2(h[0],-h[1])+nutation)%360
