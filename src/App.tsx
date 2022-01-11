import React, { Component } from "react";
import type { MChartRef } from "mchart";

export default class App extends Component<
  {},
  { jsx: React.ReactNode | null }
> {
  state = {
    jsx: null,
  };
  ref = React.createRef<MChartRef>();

  componentDidMount() {
    import("mchart").then(({ Bar }) => {
      this.setState({
        jsx: (
          <Bar
            ref={this.ref}
            name="123"
            data={[1, 2, 3, 4, 5, 6, 7]}
            option={{
              xAxis: {
                data: ["a", "b", "c", "d", "e", "f"],
              },
            }}
          />
        ),
      });
    });
  }

  render() {
    return <div className="App">{this.state.jsx}</div>;
  }
}
