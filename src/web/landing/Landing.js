import { setTitle } from "common/tooling/routing";
import React from "react";
import { Link } from "react-router-dom";
import belts from "web/calculators/belts";
import chains from "web/calculators/chains";
import dslogs from "web/calculators/dslogs";
import {
  IMAGE as flywheelImage,
  URL as flywheelURL,
} from "web/calculators/flywheel/config";
import linear from "web/calculators/linear_mech";
import {
  IMAGE as pneumaticsImage,
  URL as pneumaticsURL,
} from "web/calculators/pneumatics/config";
import Tile from "web/landing/Tile";

export default function Landing() {
  setTitle(null);

  return (
    <>
      <section className="hero">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">ReCalc</h1>
            <h2 className="subtitle">
              A collaboration focused mechanical design calculator
            </h2>
          </div>
        </div>
      </section>

      <div>
        <div className="columns">
          <div className="column is-one-third">
            <Tile
              to={flywheelURL}
              title="Flywheel Calculator"
              image={flywheelImage}
            />
          </div>
          <div className="column is-one-third">
            <Tile to={belts.url} title={belts.title} image={belts.image} />
          </div>
          <div className="column is-one-third">
            <Tile
              to={pneumaticsURL}
              title="Pneumatics Calculator"
              image={pneumaticsImage}
            />
          </div>
        </div>

        <div className="columns">
          <div className="column is-one-third">
            <Tile to={linear.url} title={linear.title} />
          </div>
          <div className="column is-one-third">
            <Tile to={chains.url} title={chains.title} />
          </div>
          <div className="column is-one-third">
            <Tile to={dslogs.url} title={dslogs.title} />
          </div>
        </div>

        <div className="columns">
          <div className="column is-narrow">
            <Link to="/about">
              <div className="card">
                <div className="card-content">
                  <p className="title">About</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
