import Model from "common/models/Model";
import { isEqual } from "lodash";

export enum RatioType {
  REDUCTION = "Reduction",
  STEP_UP = "Step-up",
}

export type RatioDict = {
  readonly magnitude: number;
  readonly ratioType: RatioType;
};

export default class Ratio extends Model {
  public readonly magnitude: number;
  public readonly ratioType: RatioType;

  constructor(magnitude: number, ratioType: RatioType = RatioType.REDUCTION) {
    super("Ratio");
    this.magnitude = magnitude;
    this.ratioType = ratioType;
  }

  asNumber(): number {
    return this.magnitude === 0 || this.ratioType === RatioType.REDUCTION
      ? this.magnitude
      : 1.0 / this.magnitude;
  }

  toDict(): RatioDict {
    return {
      magnitude: this.magnitude,
      ratioType: this.ratioType,
    };
  }

  static fromDict(d: RatioDict): Ratio {
    return new Ratio(d.magnitude, d.ratioType);
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Ratio && isEqual(m.toDict(), this.toDict());
  }
}
