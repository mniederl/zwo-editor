import renderer from "react-test-renderer";
import { expect, it } from "vitest"; // or you can configure globals

import { genId } from "../../../utils/id";
import Bar from "../../Bar/Bar";
import { Zones } from "../../constants";

it("Bar renders correctly", () => {
  const bar = {
    time: 50,
    power: Zones.Z3.min,
    type: "bar",
    id: genId(),
  };
  const ftp = 250;

  const component = renderer.create(
    <Bar
      key={bar.id}
      id={bar.id}
      time={bar.time}
      power={bar.power}
      ftp={ftp}
      onChange={() => handleOnChange}
      onClick={() => handleOnClick}
    />,
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
