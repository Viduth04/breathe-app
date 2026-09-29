// Importing an .svg gives a React component (react-native-svg-transformer, see metro.config.js)
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const content: FC<SvgProps>;
  export default content;
}
