export type PowerFactorInputKind = 'true-pf' | 'displacement-cos-phi';

export interface AcPowerResult {
  apparentPowerVA: number;
  activePowerW: number;
  /** Only a classical fundamental-frequency reactive power in displacement mode. */
  reactivePowerVAr: number | null;
  /** Residual non-active power; may contain distortion and must not be labelled Q. */
  nonActivePowerVA: number;
  factor: number;
  factorKind: PowerFactorInputKind;
  requiresTrueRms: boolean;
}

function finish(apparentPowerVA: number, factor: number, factorKind: PowerFactorInputKind): AcPowerResult | null {
  if (!Number.isFinite(apparentPowerVA) || apparentPowerVA <= 0 || !Number.isFinite(factor) || factor < 0 || factor > 1) return null;
  const activePowerW = apparentPowerVA * factor;
  const residual = Math.sqrt(Math.max(0, apparentPowerVA ** 2 - activePowerW ** 2));
  return {
    apparentPowerVA,
    activePowerW,
    reactivePowerVAr: factorKind === 'displacement-cos-phi' ? residual : null,
    nonActivePowerVA: residual,
    factor,
    factorKind,
    requiresTrueRms: factorKind === 'true-pf',
  };
}

export function singlePhasePower(voltageRmsV: number, currentRmsA: number, factor: number, factorKind: PowerFactorInputKind): AcPowerResult | null {
  if (voltageRmsV <= 0 || currentRmsA <= 0) return null;
  return finish(voltageRmsV * currentRmsA, factor, factorKind);
}

/** Balanced three-phase load, using line-to-line voltage and line current. */
export function balancedThreePhasePower(lineVoltageRmsV: number, lineCurrentRmsA: number, factor: number, factorKind: PowerFactorInputKind): AcPowerResult | null {
  if (lineVoltageRmsV <= 0 || lineCurrentRmsA <= 0) return null;
  return finish(Math.sqrt(3) * lineVoltageRmsV * lineCurrentRmsA, factor, factorKind);
}
