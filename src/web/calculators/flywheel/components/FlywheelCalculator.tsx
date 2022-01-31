import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
  MotorInput, NumberInput,
  RatioInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns, Divider } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useMemo } from "react";
import flywheelConfig, {
  FlywheelParamsV2,
  FlywheelStateV2,
} from "web/calculators/flywheel";
import { FlywheelState } from "web/calculators/flywheel/converter";
import {
  calculateFlywheelEnergy,
  calculateProjectileEnergy,
  calculateProjectileExitVelocity,
  calculateRecoveryTime,
  calculateShooterWheelSurfaceSpeed,
  calculateSpeedAfterShot,
  calculateWindupTime,
} from "web/calculators/flywheel/flywheelMath";
import KvKaDisplay from "web/calculators/shared/components/KvKaDisplay";
import { calculateKa, calculateKv } from "web/calculators/shared/sharedMath";
import MotorSelector from "web/calculators/shared/components/MotorSelector";

export default function FlywheelCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    FlywheelState.getState() as FlywheelStateV2
  );

  const windupTime = useMemo(
    () =>
      calculateWindupTime(
        get.shooterMomentOfInertia.add(
          get.flywheelMomentOfInertia.div(
            get.flywheelRatio.asNumber() == 0
              ? 1
              : Math.pow(get.flywheelRatio.asNumber(), 2)
          )
        ),
        get.motor,
        get.currentLimit,
        get.ratio,
        get.shooterTargetSpeed
      ),
    [
      get.motor,
      get.currentLimit,
      get.ratio,
      get.shooterTargetSpeed,
      get.shooterMomentOfInertia,
      get.flywheelMomentOfInertia,
      get.flywheelRatio,
    ]
  );

  const shooterTopSpeed = useMemo(
    () =>
      get.ratio.asNumber() === 0
        ? new Measurement(0, "rpm")
        : get.motor.freeSpeed.div(get.ratio.asNumber()),
    [get.ratio, get.motor.freeSpeed]
  );

  const shooterSurfaceSpeed = useMemo(
    () =>
      calculateShooterWheelSurfaceSpeed(
        get.shooterTargetSpeed,
        get.shooterRadius
      ),
    [get.shooterTargetSpeed, get.shooterRadius]
  );

  const projectileSpeed = useMemo(
    () =>
      calculateProjectileExitVelocity(
        get.projectileWeight,
        get.shooterRadius,
        get.shooterMomentOfInertia.add(
          get.flywheelMomentOfInertia.div(
            get.flywheelRatio.asNumber() == 0
              ? 1
              : Math.pow(get.flywheelRatio.asNumber(), 2)
          )
        ),
        shooterSurfaceSpeed
      ),
    [
      get.projectileWeight,
      get.shooterRadius,
      get.shooterMomentOfInertia,
      get.flywheelMomentOfInertia,
      get.flywheelRatio,
      shooterSurfaceSpeed
    ]
  );

  const projectileEnergy = useMemo(
    () => calculateProjectileEnergy(projectileSpeed, get.projectileWeight),
    [projectileSpeed, get.projectileWeight]
  );

  const flywheelEnergy = useMemo(
    () =>
      calculateFlywheelEnergy(
        get.shooterMomentOfInertia.add(
          get.flywheelMomentOfInertia.div(
            get.flywheelRatio.asNumber() == 0
              ? 1
              : Math.pow(get.flywheelRatio.asNumber(), 2)
          )
        ),
        get.shooterTargetSpeed
      ),
    [
      get.shooterMomentOfInertia,
      get.flywheelMomentOfInertia,
      get.flywheelRatio,
      get.shooterTargetSpeed,
    ]
  );

  const speedAfterShot = useMemo(
    () =>
      calculateSpeedAfterShot(
        get.shooterMomentOfInertia.add(
          get.flywheelMomentOfInertia.div(
            get.flywheelRatio.asNumber() == 0
              ? 1
              : Math.pow(get.flywheelRatio.asNumber(), 2)
          )
        ),
        flywheelEnergy,
        projectileEnergy
      ),
    [
      get.shooterMomentOfInertia,
      get.flywheelMomentOfInertia,
      get.flywheelRatio,
      flywheelEnergy,
      projectileEnergy,
    ]
  );

  const totalMomentOfInertia = useMemo(
    () =>
      get.shooterMomentOfInertia.add(
        get.flywheelMomentOfInertia.div(
          get.flywheelRatio.asNumber() == 0
            ? 1
            : Math.pow(get.flywheelRatio.asNumber(), 2)
        )
      ),
    [get.shooterMomentOfInertia, get.flywheelMomentOfInertia, get.flywheelRatio]
  );

  const recoveryTime = useMemo(
    () =>
      calculateRecoveryTime(
        totalMomentOfInertia,
        get.motor,
        get.ratio,
        1 / 100,
        get.shooterTargetSpeed,
        speedAfterShot,
        get.currentLimit
      ),
    [
      totalMomentOfInertia,
      get.motor,
      get.ratio,
      get.shooterTargetSpeed,
      speedAfterShot,
      get.currentLimit,
    ]
  );

  const kV = useMemo(
    () =>
      calculateKv(
        get.motor.freeSpeed.div(get.ratio.asNumber()),
        get.flywheelRadius
      ),
    [get.motor.freeSpeed, get.ratio, get.flywheelRadius]
  );

  const kA = useMemo(
    () =>
      calculateKa(
        get.motor.stallTorque
          .mul(get.motor.quantity)
          .mul(get.ratio.asNumber())
          .mul(get.efficiency / 100),
        get.flywheelRadius,
        totalMomentOfInertia.div(get.flywheelRadius.mul(get.flywheelRadius))
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.ratio,
      get.efficiency,
      get.flywheelRadius,
      totalMomentOfInertia,
    ]
  );

  useEffect(() => {
    if (!get.useCustomShooterMoi) {
      set.setShooterMomentOfInertia(
        get.shooterRadius.mul(get.shooterRadius).mul(get.shooterWeight).div(2)
      );
    }
  }, [get.shooterRadius, get.shooterWeight, get.useCustomShooterMoi]);

  useEffect(() => {
    if (!get.useCustomFlywheelMoi) {
      const pureMOI = get.flywheelRadius
        .mul(get.flywheelRadius)
        .mul(get.flywheelWeight)
        .div(2);
      set.setFlywheelMomentOfInertia(
        get.flywheelRatio.asNumber() === 0 ? pureMOI.mul(0) : pureMOI
      );
    }
  }, [
    get.flywheelRadius,
    get.flywheelWeight,
    get.useCustomFlywheelMoi,
    get.flywheelRatio,
  ]);

  return (
    <>
      <SimpleHeading
        state={get}
        title={flywheelConfig.title}
        queryParams={FlywheelParamsV2}
      />
      <Columns multiline>
        <Column>
          <MotorSelector get={get} set={set} />
          <SingleInputLine
            label="Current Limit"
            id="currentLimit"
            tooltip="The current limit applied to each motor."
          >
            <MeasurementInput
              stateHook={[get.currentLimit, set.setCurrentLimit]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Max Speed"
            id="shooterMaxSpeed"
            tooltip="The max possible speed of the shooter wheel(s)."
          >
            <MeasurementOutput
              stateHook={[shooterTopSpeed, () => undefined]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Target Shooter RPM"
            id="shooterRPM"
            tooltip="The desired speed of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterTargetSpeed, set.setShooterTargetSpeed]}
              dangerIf={() => get.shooterTargetSpeed.gte(shooterTopSpeed)}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Projectile Weight"
            id="projectileWeight"
            tooltip="The weight of the ball you are shooting."
          >
            <MeasurementInput
              stateHook={[get.projectileWeight, set.setProjectileWeight]}
            />
          </SingleInputLine>

          <Divider color={"primary"}>Shooter Wheel Properties</Divider>
          <SingleInputLine
            label="Shooter Radius"
            id="shooterRadius"
            tooltip="The radius of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterRadius, set.setShooterRadius]}
              numberDisabledIf={() => get.useCustomShooterMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Weight"
            id="shooterWeight"
            tooltip="The weight of the shooter wheel(s)."
          >
            <MeasurementInput
              stateHook={[get.shooterWeight, set.setShooterWeight]}
              numberDisabledIf={() => get.useCustomShooterMoi}
            />
          </SingleInputLine>
          <Columns formColumns>
            <Column ofTwelve={5}>
              <SingleInputLine
                label="Use Custom Shooter MOI"
                id="useCustomShooterMOI"
                tooltip="Use if you already have a moment of inertia for your shooter wheel(s), likely from CAD."
              >
                <BooleanInput
                  stateHook={[
                    get.useCustomShooterMoi,
                    set.setUseCustomShooterMoi,
                  ]}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Custom Shooter MOI"
                id="customShooterMOI"
                tooltip="The moment of inertia of the shooter wheel(s)."
              >
                <MeasurementInput
                  stateHook={[
                    get.shooterMomentOfInertia,
                    set.setShooterMomentOfInertia,
                  ]}
                  numberDisabledIf={() => !get.useCustomShooterMoi}
                  numberRoundTo={1}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <Divider color="primary">Flywheel Properties</Divider>
          <SingleInputLine
            label="Flywheel Radius"
            id="flywheelRadius"
            tooltip="The radius of the weighted flywheel."
          >
            <MeasurementInput
              stateHook={[get.flywheelRadius, set.setFlywheelRadius]}
              numberDisabledIf={() => get.useCustomFlywheelMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel Weight"
            id="flywheelWeight"
            tooltip="The weight of the weighted flywheel. Use zero if you don't have one."
          >
            <MeasurementInput
              stateHook={[get.flywheelWeight, set.setFlywheelWeight]}
              numberDisabledIf={() => get.useCustomFlywheelMoi}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel:Shooter Ratio"
            id="flywheelShooterRatio"
            tooltip="The ratio between the flywheel and the shooter wheel(s). Use 1 if coaxial."
          >
            <RatioInput stateHook={[get.flywheelRatio, set.setFlywheelRatio]} />
          </SingleInputLine>
          <Columns formColumns>
            <Column ofTwelve={5}>
              <SingleInputLine
                label="Use Custom Flywheel MOI"
                id="useCustomFlywheelMOI"
                tooltip="Use if you already have a moment of inertia for your flywheel, likely from CAD or a vendor."
              >
                <BooleanInput
                  stateHook={[
                    get.useCustomFlywheelMoi,
                    set.setUseCustomFlywheelMoi,
                  ]}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Custom Flywheel MOI"
                id="customFlywheelMOI"
                tooltip="The moment of inertia of the flywheel."
              >
                <MeasurementInput
                  stateHook={[
                    get.flywheelMomentOfInertia,
                    set.setFlywheelMomentOfInertia,
                  ]}
                  numberDisabledIf={() => !get.useCustomFlywheelMoi}
                  numberRoundTo={1}
                />
              </SingleInputLine>
            </Column>
          </Columns>
        </Column>
        <Column>
          <Divider color="primary">Outputs</Divider>
          <SingleInputLine
            label="Estimated Windup Time"
            id="windupTime"
            tooltip="The estimated time it takes the system to reach the target speed from rest."
          >
            <MeasurementOutput
              stateHook={[windupTime, () => undefined]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Recovery Time"
            id="recoveryTime"
            tooltip="The estimated time it takes the system to reach the target speed immediately following a shot."
          >
            <MeasurementOutput
              stateHook={[recoveryTime, () => undefined]}
              numberRoundTo={4}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Shooter Wheel Surface Speed"
            id="surfaceSpeed"
            tooltip="The speed of the surface of the shooter wheel(s)."
          >
            <MeasurementOutput
              stateHook={[shooterSurfaceSpeed, () => undefined]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Projectile Speed"
            id="projectileSpeed"
            tooltip="The estimated speed of the projectile after being shot."
          >
            <MeasurementOutput
              stateHook={[projectileSpeed, () => undefined]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Speed After Shot"
            id="speedAfterShot"
            tooltip="The estimated speed of the shooter wheels immediately following a shot."
          >
            <MeasurementOutput
              stateHook={[speedAfterShot, () => undefined]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Flywheel Energy"
            id="flywheelEnergy"
            tooltip="The energy stored in the flywheel."
          >
            <MeasurementOutput
              stateHook={[flywheelEnergy, () => undefined]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Projectile Energy"
            id="projectileEnergy"
            tooltip="The amount of energy transferred into the projectile in a shot."
          >
            <MeasurementOutput
              stateHook={[projectileEnergy, () => undefined]}
              numberRoundTo={0}
            />
          </SingleInputLine>
          <KvKaDisplay kV={kV} kA={kA} distanceType={"linear"} />
        </Column>
      </Columns>
    </>
  );
}
