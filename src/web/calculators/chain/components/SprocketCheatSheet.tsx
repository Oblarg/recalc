import { Divider } from "common/components/styling/Building";
import Chain, { chainPitchMap } from "common/models/Chain";
import _data from "common/models/data/sprockets.json";
import { FRCVendor } from "common/models/ExtraTypes";
import Sprocket from "common/models/Sprocket";
import React from "react";

export default function SprocketCheatSheet(props: {
  chainType: Chain;
}): JSX.Element {
  const data = _data
    .map((s) => {
      return new Sprocket(s.teeth, chainPitchMap[s.chain], {
        bore: s.bore,
        vendors: s.vendors as FRCVendor[],
        wrong: s.wrong,
      });
    })
    .filter((s) => s.pitch.eq(props.chainType.pitch));

  const VendorList = (vendors: FRCVendor[]) =>
    vendors
      .map<React.ReactNode>((v) => <span key={v + Math.random()}>{v}</span>)
      .reduce((p, c) => [p, ", ", c]);

  return (
    <>
      <Divider paddingLess color="primary">
        Matching COTS Sprockets
      </Divider>
      <div className="table-container">
        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Pitch</th>
              <th>Teeth</th>
              <th>Pitch Diameter</th>
              <th>Bore</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sprocket) => (
              <tr key={JSON.stringify(sprocket)}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <td>{VendorList(sprocket.vendors!)}</td>
                <td>{sprocket.pitch.format()}</td>
                <td>{sprocket.teeth}</td>
                <td>
                  {sprocket.pitchDiameter.to("in").toPrecision(0.001).scalar}"
                </td>
                <td>{sprocket.bore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const Sprocket25ChainCheatSheet = React.memo(() => (
  <SprocketCheatSheet chainType={new Chain("#25")} />
));
export const Sprocket35ChainCheatSheet = React.memo(() => (
  <SprocketCheatSheet chainType={new Chain("#35")} />
));
export const EmptyCheatSheet = React.memo(() => (
  <SprocketCheatSheet chainType={new Chain("#50")} />
));
