import React, { useState, useEffect } from "react";
import ReactSlider from "react-slider";

export const Controls = ({ onValuesChange }) => {
  const [flood, setFlood] = useState(23);
  const [opacity, setOpacity] = React.useState(90);

  const [r, setR] = React.useState(177);
  const [g, setG] = React.useState(150);
  const [b, setB] = React.useState(226);

  useEffect(() => {
    onValuesChange({ flood, opacity, r, g, b });
  }, [flood, opacity, r, g, b]);

  <div
    style={{
      position: "absolute",
      left: 25,
      top: 25,
      width: 200,
      height: 200,
      border: 1,
      zIndex: 1,
    }}
  >
    <div className="card">
      <h4>Flood</h4>
      <div className="slider">
        <ReactSlider
          className="customSlider"
          trackClassName="customSlider-track"
          thumbClassName="customSlider-thumb"
          value={flood}
          onChange={(e) => setFlood(e)}
          renderThumb={(props, state) => (
            <div {...props}>{state.valueNow}</div>
          )}
        />
      </div>
    </div>
    <div className="card">
      <h4>Opacity</h4>
      <div className="slider">
        <ReactSlider
          className="customSlider"
          trackClassName="customSlider-track"
          thumbClassName="customSlider-thumb"
          value={opacity}
          onChange={(e) => setOpacity(e)}
          renderThumb={(props, state) => (
            <div {...props}>{state.valueNow}</div>
          )}
        />
      </div>
    </div>
    <div className="card color">
      <h4>Color</h4>
      <div className="slider">
        <ReactSlider
          className="customSlider"
          trackClassName="customSlider-track"
          thumbClassName="customSlider-thumb"
          max={255}
          value={r}
          onChange={(e) => setR(e)}
          renderThumb={(props, state) => (
            <div {...props}>{state.valueNow}</div>
          )}
        />
      </div>
      <div className="slider">
        <ReactSlider
          className="customSlider"
          trackClassName="customSlider-track"
          thumbClassName="customSlider-thumb"
          max={255}
          value={g}
          onChange={(e) => setG(e)}
          renderThumb={(props, state) => (
            <div {...props}>{state.valueNow}</div>
          )}
        />
      </div>
      <div className="slider">
        <ReactSlider
          className="customSlider"
          trackClassName="customSlider-track"
          thumbClassName="customSlider-thumb"
          max={255}
          value={b}
          onChange={(e) => setB(e)}
          renderThumb={(props, state) => (
            <div {...props}>{state.valueNow}</div>
          )}
        />
      </div>
    </div>
  </div>