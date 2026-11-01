import React from 'react';
import { View } from 'react-native';

type LiquidGlassModule = typeof import('@callstack/liquid-glass');

let LiquidGlassView: LiquidGlassModule['LiquidGlassView'];
let isLiquidGlassSupported: boolean;

try {
  const mod = require('@callstack/liquid-glass') as LiquidGlassModule;
  LiquidGlassView = mod.LiquidGlassView;
  isLiquidGlassSupported =
    typeof mod.isLiquidGlassSupported === 'boolean' ? mod.isLiquidGlassSupported : false;
} catch (err) {
  LiquidGlassView = ({ children, style, ...rest }: any) => (
    <View style={style} {...rest}>
      {children}
    </View>
  );
  isLiquidGlassSupported = false;
}

export { LiquidGlassView, isLiquidGlassSupported };
