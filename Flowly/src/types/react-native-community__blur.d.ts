declare module '@react-native-community/blur' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export type BlurType =
    | 'xlight'
    | 'light'
    | 'dark'
    | 'extraDark'
    | 'regular'
    | 'prominent';

  export interface BlurViewProps extends ViewProps {
    blurType?: BlurType;
    blurAmount?: number;
    reducedTransparencyFallbackColor?: string;
    overlayColor?: string;
    downsampleFactor?: number;
  }

  export class BlurView extends React.Component<BlurViewProps> {}
  const _default: typeof BlurView;
  export default _default;
}
